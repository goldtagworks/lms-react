/* eslint-disable */
import type { DashboardStats, CourseStats, StudentStats, RevenueChart, ExamStats } from '@main/types/dashboard';

import { supabase } from '@main/lib/supabase';

/**
 * 관리자 대시보드 전체 통계 조회
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const [coursesResult, studentsResult, instructorsResult, revenueResult, enrollmentsResult, certificatesResult, examsResult] = await Promise.all([
            supabase.from('courses').select('id', { count: 'exact', head: true }),
            supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('profiles').select('user_id', { count: 'exact', head: true }).eq('role', 'instructor'),
            supabase.from('payments').select('amount_cents').eq('status', 'completed'),
            supabase
                .from('enrollments')
                .select('created_at', { count: 'exact', head: true })
                .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
            supabase.from('certificates').select('id', { count: 'exact', head: true }),
            supabase.from('exams').select('id', { count: 'exact', head: true })
        ]);

        const totalRevenue = revenueResult.data?.reduce((sum, payment) => sum + payment.amount_cents, 0) || 0;

        return {
            totalCourses: coursesResult.count || 0,
            totalStudents: studentsResult.count || 0,
            totalInstructors: instructorsResult.count || 0,
            totalRevenue: Math.round(totalRevenue / 100), // cents to currency
            newEnrollmentsThisMonth: enrollmentsResult.count || 0,
            certificatesIssued: certificatesResult.count || 0,
            activeExams: examsResult.count || 0
        };
    } catch (error) {
        console.error('대시보드 통계 조회 오류:', error);
        throw error;
    }
}

/**
 * 인기 코스 통계 조회
 */
export async function getTopCourses(limit = 10): Promise<CourseStats[]> {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select(
                `
                id,
                title,
                profiles!inner (
                    display_name
                ),
                enrollments (
                    id,
                    payments (
                        amount_cents
                    )
                ),
                course_reviews (
                    rating
                )
            `
            )
            .limit(limit);

        if (error) throw error;

        return (data || [])
            .map((course: any) => {
                const enrollments = course.enrollments || [];
                const reviews = course.course_reviews || [];
                const payments = enrollments.flatMap((e: any) => e.payments || []);

                return {
                    id: course.id,
                    title: course.title,
                    instructorName: course.profiles.display_name,
                    enrollmentCount: enrollments.length,
                    revenue: payments.reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0) / 100,
                    averageRating: reviews.length > 0 ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0,
                    completionRate: 0 // TODO: 진도 기반 계산
                };
            })
            .sort((a, b) => b.enrollmentCount - a.enrollmentCount);
    } catch (error) {
        console.error('인기 코스 통계 조회 오류:', error);
        throw error;
    }
}

/**
 * 활성 학생 통계 조회
 */
export async function getActiveStudents(limit = 10): Promise<StudentStats[]> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select(
                `
                user_id,
                display_name,
                auth.users!inner (
                    email
                ),
                enrollments (
                    id,
                    updated_at
                ),
                certificates (
                    id
                )
            `
            )
            .eq('role', 'student')
            .limit(limit);

        if (error) throw error;

        return (data || [])
            .map((student: any) => {
                const enrollments = student.enrollments || [];
                const certificates = student.certificates || [];
                const lastActivity = enrollments.length > 0 ? Math.max(...enrollments.map((e: any) => new Date(e.updated_at).getTime())) : 0;

                return {
                    id: student.user_id,
                    displayName: student.display_name || 'Unknown',
                    email: student.auth?.users?.email || '',
                    enrollmentCount: enrollments.length,
                    certificatesCount: certificates.length,
                    lastActivity: lastActivity > 0 ? new Date(lastActivity).toISOString() : ''
                };
            })
            .sort((a, b) => b.enrollmentCount - a.enrollmentCount);
    } catch (error) {
        console.error('활성 학생 통계 조회 오류:', error);
        throw error;
    }
}

/**
 * 월별 매출 차트 데이터 조회
 */
export async function getRevenueChart(months = 6): Promise<RevenueChart[]> {
    try {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const { data: payments, error } = await supabase
            .from('payments')
            .select('amount_cents, created_at, enrollments!inner (id)')
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString());

        if (error) throw error;

        // 월별로 그룹핑
        const monthlyData: Record<string, { revenue: number; enrollments: number }> = {};

        (payments || []).forEach((payment: any) => {
            const date = new Date(payment.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { revenue: 0, enrollments: 0 };
            }

            monthlyData[monthKey].revenue += payment.amount_cents / 100;
            monthlyData[monthKey].enrollments += 1;
        });

        return Object.entries(monthlyData)
            .map(([month, data]) => ({
                month,
                revenue: data.revenue,
                enrollments: data.enrollments
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
        console.error('매출 차트 데이터 조회 오류:', error);
        throw error;
    }
}

/**
 * 시험 통계 조회
 */
export async function getExamStats(): Promise<ExamStats[]> {
    try {
        const { data, error } = await supabase.from('exams').select(`
                id,
                title,
                courses!inner (
                    title
                ),
                exam_attempts (
                    score,
                    passed
                )
            `);

        if (error) throw error;

        return (data || [])
            .map((exam: any) => {
                const attempts = exam.exam_attempts || [];
                const passedAttempts = attempts.filter((a: any) => a.passed);

                return {
                    id: exam.id,
                    title: exam.title,
                    courseTitle: exam.courses.title,
                    attemptCount: attempts.length,
                    averageScore: attempts.length > 0 ? attempts.reduce((sum: number, a: any) => sum + a.score, 0) / attempts.length : 0,
                    passRate: attempts.length > 0 ? (passedAttempts.length / attempts.length) * 100 : 0
                };
            })
            .sort((a, b) => b.attemptCount - a.attemptCount);
    } catch (error) {
        console.error('시험 통계 조회 오류:', error);
        throw error;
    }
}

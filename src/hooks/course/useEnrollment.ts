import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';

export interface EnrollmentWithCourse {
    id: string;
    course_id: string;
    user_id: string;
    status: 'PENDING' | 'ENROLLED' | 'CANCELLED';
    source: 'free' | 'purchase' | 'manual';
    enrolled_at: string | null;
    payment_id: string | null;
    created_at: string;
    // Course info
    course?: {
        id: string;
        title: string;
        description: string | null;
        instructor_id: string;
        thumbnail_url: string | null;
    };
}

/**
 * 단일 수강신청 조회 (코스 정보 포함)
 */
export function useEnrollment(enrollmentId: string) {
    return useQuery({
        queryKey: ['enrollment', enrollmentId],
        queryFn: async (): Promise<EnrollmentWithCourse> => {
            const { data: enrollment, error } = await supabase
                .from('enrollments')
                .select(
                    `
                    *,
                    course:courses (
                        id,
                        title,
                        description,
                        instructor_id,
                        thumbnail_url
                    )
                `
                )
                .eq('id', enrollmentId)
                .single();

            if (error) throw error;
            if (!enrollment) throw new Error('Enrollment not found');

            return enrollment;
        },
        enabled: !!enrollmentId
    });
}

/**
 * 사용자의 모든 수강신청 조회
 */
export function useUserEnrollments(userId: string) {
    return useQuery({
        queryKey: ['enrollments', 'user', userId],
        queryFn: async (): Promise<EnrollmentWithCourse[]> => {
            const { data: enrollments, error } = await supabase
                .from('enrollments')
                .select(
                    `
                    *,
                    course:courses (
                        id,
                        title,
                        description,
                        instructor_id,
                        thumbnail_url
                    )
                `
                )
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return enrollments || [];
        },
        enabled: !!userId
    });
}

/**
 * 코스의 첫 번째 레슨 ID 조회
 */
export function useFirstLessonId(courseId: string) {
    return useQuery({
        queryKey: ['course', courseId, 'firstLesson'],
        queryFn: async (): Promise<string | null> => {
            const { data: lessons, error } = await supabase
                .from('lessons')
                .select('id')
                .eq('course_id', courseId)
                .eq('is_section', false) // 섹션 헤더 제외
                .order('order_index')
                .limit(1);

            if (error) throw error;

            return lessons?.[0]?.id || null;
        },
        enabled: !!courseId
    });
}

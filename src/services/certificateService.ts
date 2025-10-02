import type { Certificate, CertificateWithDetails, IssueCertificateRequest, IssueCertificateResponse } from '@main/types/certificate';

import { supabase } from '@main/lib/supabase';

/**
 * 수료증 발급 (Edge Function 호출)
 */
export async function issueCertificate(request: IssueCertificateRequest): Promise<IssueCertificateResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('issue-certificate', {
            body: request
        });

        if (error) {
            throw new Error(`Certificate issuance failed: ${error.message}`);
        }

        return data as IssueCertificateResponse;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('수료증 발급 오류:', error);
        throw error;
    }
}

/**
 * 사용자별 수료증 목록 조회
 */
export async function getCertificatesByUser(userId: string): Promise<CertificateWithDetails[]> {
    try {
        const { data, error } = await supabase
            .from('certificates')
            .select(
                `
                id,
                enrollment_id,
                exam_attempt_id,
                issued_at,
                pdf_path,
                serial_no,
                enrollments!inner (
                    id,
                    courses!inner (
                        id,
                        title,
                        profiles!inner (
                            display_name
                        )
                    ),
                    profiles!inner (
                        user_id,
                        display_name
                    )
                ),
                exam_attempts!inner (
                    id,
                    score,
                    passed
                )
            `
            )
            .eq('enrollments.profiles.user_id', userId)
            .order('issued_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch certificates: ${error.message}`);
        }

        return (data || []).map((cert: any) => ({
            id: cert.id,
            enrollmentId: cert.enrollment_id,
            examAttemptId: cert.exam_attempt_id,
            issuedAt: cert.issued_at,
            pdfPath: cert.pdf_path,
            serialNo: cert.serial_no,
            enrollment: {
                id: cert.enrollments.id,
                course: {
                    id: cert.enrollments.courses.id,
                    title: cert.enrollments.courses.title,
                    instructorName: cert.enrollments.courses.profiles.display_name
                },
                user: {
                    id: cert.enrollments.profiles.user_id,
                    displayName: cert.enrollments.profiles.display_name
                }
            },
            examAttempt: {
                id: cert.exam_attempts.id,
                score: cert.exam_attempts.score,
                passed: cert.exam_attempts.passed
            }
        }));
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('수료증 목록 조회 오류:', error);
        throw error;
    }
}

/**
 * 특정 수강신청의 수료증 조회
 */
export async function getCertificateByEnrollment(enrollmentId: string): Promise<Certificate | null> {
    try {
        const { data, error } = await supabase.from('certificates').select('*').eq('enrollment_id', enrollmentId).single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No rows found
                return null;
            }
            throw new Error(`Failed to fetch certificate: ${error.message}`);
        }

        return {
            id: data.id,
            enrollmentId: data.enrollment_id,
            examAttemptId: data.exam_attempt_id,
            issuedAt: data.issued_at,
            pdfPath: data.pdf_path,
            serialNo: data.serial_no
        };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('수료증 조회 오류:', error);
        throw error;
    }
}

/**
 * 수료증 PDF 다운로드 URL 생성
 */
export async function getCertificatePdfUrl(pdfPath: string): Promise<string> {
    try {
        const { data } = await supabase.storage.from('certificates').createSignedUrl(pdfPath, 3600); // 1시간 유효

        if (!data?.signedUrl) {
            throw new Error('Failed to generate PDF download URL');
        }

        return data.signedUrl;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('수료증 PDF URL 생성 오류:', error);
        throw error;
    }
}

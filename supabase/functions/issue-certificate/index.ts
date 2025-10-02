/* eslint-disable */
// Deno Edge Function - TypeScript errors expected in Node.js environment
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-timestamp'
};

interface IssueCertificateRequest {
    enrollmentId: string;
    examAttemptId: string;
}

interface CertificateData {
    courseTitle: string;
    studentName: string;
    instructorName: string;
    completionDate: string;
    examScore: number;
}

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 환경변수에서 Supabase 클라이언트 생성
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ code: 'E_METHOD_NOT_ALLOWED', message: 'Only POST method allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { enrollmentId, examAttemptId }: IssueCertificateRequest = await req.json();

        console.log(
            JSON.stringify({
                function_name: 'issue-certificate',
                enrollment_id: enrollmentId,
                exam_attempt_id: examAttemptId,
                status: 'started'
            })
        );

        // 1. 이미 수료증이 발급되었는지 확인
        const { data: existingCert } = await supabase.from('certificates').select('id, serial_no, pdf_path, issued_at').eq('enrollment_id', enrollmentId).single();

        if (existingCert) {
            console.log(
                JSON.stringify({
                    function_name: 'issue-certificate',
                    enrollment_id: enrollmentId,
                    status: 'already_issued',
                    certificate_id: existingCert.id
                })
            );

            return new Response(
                JSON.stringify({
                    certificateId: existingCert.id,
                    serialNo: existingCert.serial_no,
                    pdfPath: existingCert.pdf_path,
                    issuedAt: existingCert.issued_at
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // 2. 시험 합격 여부 및 관련 데이터 조회
        const { data: attemptData, error: attemptError } = await supabase
            .from('exam_attempts')
            .select(
                `
                id,
                score,
                passed,
                enrollments!inner (
                    id,
                    user_id,
                    courses!inner (
                        id,
                        title,
                        instructor_id,
                        profiles!inner (
                            display_name
                        )
                    ),
                    profiles!inner (
                        display_name
                    )
                )
            `
            )
            .eq('id', examAttemptId)
            .eq('enrollment_id', enrollmentId)
            .single();

        if (attemptError || !attemptData) {
            return new Response(JSON.stringify({ code: 'E_ATTEMPT_NOT_FOUND', message: 'Exam attempt not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!attemptData.passed) {
            return new Response(JSON.stringify({ code: 'E_EXAM_NOT_PASSED', message: 'Exam not passed' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. 수료증 데이터 준비
        const certificateData: CertificateData = {
            courseTitle: (attemptData.enrollments as any).courses.title,
            studentName: (attemptData.enrollments as any).profiles.display_name,
            instructorName: (attemptData.enrollments as any).courses.profiles.display_name,
            completionDate: new Date().toISOString(),
            examScore: attemptData.score
        };

        // 4. PDF 생성 (간단한 구현 - 실제로는 PDF 라이브러리 사용)
        const pdfContent = generateCertificatePdf(certificateData);

        // 5. PDF 파일 저장
        const serialNo = generateSerialNumber();
        const pdfPath = `${enrollmentId}/${serialNo}.pdf`;

        const { error: uploadError } = await supabase.storage.from('certificates').upload(pdfPath, pdfContent, {
            contentType: 'application/pdf',
            upsert: false
        });

        if (uploadError) {
            console.error('PDF upload error:', uploadError);
            return new Response(JSON.stringify({ code: 'E_PDF_UPLOAD_FAILED', message: 'Failed to upload PDF' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 6. 수료증 레코드 생성
        const { data: certificate, error: certError } = await supabase
            .from('certificates')
            .insert({
                enrollment_id: enrollmentId,
                exam_attempt_id: examAttemptId,
                pdf_path: pdfPath,
                serial_no: serialNo,
                issued_at: new Date().toISOString()
            })
            .select('id, serial_no, pdf_path, issued_at')
            .single();

        if (certError || !certificate) {
            console.error('Certificate creation error:', certError);
            return new Response(JSON.stringify({ code: 'E_CERT_CREATE_FAILED', message: 'Failed to create certificate record' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(
            JSON.stringify({
                function_name: 'issue-certificate',
                enrollment_id: enrollmentId,
                certificate_id: certificate.id,
                serial_no: serialNo,
                status: 'success'
            })
        );

        return new Response(
            JSON.stringify({
                certificateId: certificate.id,
                serialNo: certificate.serial_no,
                pdfPath: certificate.pdf_path,
                issuedAt: certificate.issued_at
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Certificate issuance error:', error);
        return new Response(JSON.stringify({ code: 'E_INTERNAL_ERROR', message: 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

/**
 * 간단한 PDF 생성 (실제로는 jsPDF 등 라이브러리 사용 권장)
 */
function generateCertificatePdf(data: CertificateData): Uint8Array {
    // 간단한 PDF 내용 (실제로는 proper PDF library 사용)
    const pdfContent = `
수료증

과정명: ${data.courseTitle}
수료자: ${data.studentName}
강사명: ${data.instructorName}
수료일: ${new Date(data.completionDate).toLocaleDateString('ko-KR')}
시험점수: ${data.examScore}점

이 수료증은 위 과정을 성공적으로 완료하였음을 증명합니다.
    `.trim();

    return new TextEncoder().encode(pdfContent);
}

/**
 * 수료증 일련번호 생성
 */
function generateSerialNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${timestamp}-${random}`;
}

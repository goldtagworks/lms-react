/**
 * [schema-sync] Toss Payments 결제 승인 Edge Function
 *
 * Copilot Instructions #12: Edge 공통 유틸 - verifySignature, ensureIdempotent, logEvent
 * Copilot Instructions #14: 에러 코드 - E_AMOUNT_MISMATCH, E_CURRENCY_MISMATCH, E_TAX_MISMATCH, E_DUP_TX
 * Copilot Instructions #18: 시큐리티 - X-Signature + X-Timestamp 검증, 재사용 서명 차단
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Edge 공통 유틸 (향후 별도 파일로 분리)
interface LogEvent {
    request_id: string;
    function_name: string;
    provider?: string;
    provider_tx_id?: string;
    enrollment_id?: string;
    course_id?: string;
    user_id?: string;
    status: string;
    error_code?: string;
    latency_ms: number;
}

function generateRequestId(): string {
    return crypto.randomUUID();
}

function verifySignature(rawBody: string, headers: Headers): boolean {
    // TODO: 실제 HMAC 서명 검증 구현
    const signature = headers.get('X-Signature');
    const timestamp = headers.get('X-Timestamp');

    if (!signature || !timestamp) return false;

    // 타임스탬프 검증 (300초 이내)
    const now = Date.now();
    const requestTime = parseInt(timestamp) * 1000;

    if (Math.abs(now - requestTime) > 300000) return false;

    // TODO: 실제 서명 검증 로직
    // const expectedSignature = hmacSha256(secretKey, timestamp + rawBody);
    // return signature === expectedSignature;

    return true; // 임시: 개발 중에는 모든 서명 허용
}

function ensureIdempotent(_scope: string, _key: string): { cached?: boolean } {
    // TODO: 실제 멱등성 캐시 구현 (Redis/Memory)
    // 현재는 스텁 - 항상 새로운 요청으로 처리
    return {};
}

function logEvent(event: LogEvent): void {
    // 구조화된 로그 출력
    console.log(
        JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            ...event
        })
    );
}

// 결제 승인 요청 타입
interface ConfirmPaymentRequest {
    paymentKey: string;
    orderId: string;
    amount: number;
    courseId: string;
    userId: string;
}

// 결제 승인 응답 타입
interface ConfirmPaymentResponse {
    success: boolean;
    enrollmentId?: string;
    error?: {
        code: string;
        message: string;
    };
}

serve(async (req: Request): Promise<Response> => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // CORS 헤더
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Signature, X-Timestamp'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST allowed' } }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    try {
        const rawBody = await req.text();

        // 서명 검증
        if (!verifySignature(rawBody, req.headers)) {
            logEvent({
                request_id: requestId,
                function_name: 'confirm-payment',
                status: 'SIGNATURE_INVALID',
                error_code: 'E_WEBHOOK_INVALID_SIG',
                latency_ms: Date.now() - startTime
            });

            return new Response(JSON.stringify({ error: { code: 'E_WEBHOOK_INVALID_SIG', message: 'Invalid signature' } }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const body: ConfirmPaymentRequest = JSON.parse(rawBody);
        const { paymentKey, orderId, amount, courseId, userId } = body;

        // 멱등성 확인
        const idempotencyCheck = ensureIdempotent('payment-confirm', `${paymentKey}-${orderId}`);

        if (idempotencyCheck.cached) {
            // 이미 처리된 요청 - 기존 결과 반환 (실제 구현에서는 캐시에서 조회)
            return new Response(JSON.stringify({ success: true, enrollmentId: 'cached-result' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Supabase 클라이언트 초기화
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Toss Payments API로 결제 승인
        const tossSecretKey = Deno.env.get('TOSS_SECRET_KEY')!;
        const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${btoa(tossSecretKey + ':')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ paymentKey, orderId, amount })
        });

        const tossData = await tossResponse.json();

        if (!tossResponse.ok) {
            logEvent({
                request_id: requestId,
                function_name: 'confirm-payment',
                provider: 'toss',
                provider_tx_id: paymentKey,
                user_id: userId,
                course_id: courseId,
                status: 'TOSS_CONFIRM_FAILED',
                error_code: tossData.code || 'TOSS_API_ERROR',
                latency_ms: Date.now() - startTime
            });

            return new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: tossData.code || 'TOSS_API_ERROR',
                        message: tossData.message || 'Toss API error'
                    }
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. 금액 검증
        if (tossData.totalAmount !== amount) {
            logEvent({
                request_id: requestId,
                function_name: 'confirm-payment',
                provider: 'toss',
                provider_tx_id: paymentKey,
                user_id: userId,
                course_id: courseId,
                status: 'AMOUNT_MISMATCH',
                error_code: 'E_AMOUNT_MISMATCH',
                latency_ms: Date.now() - startTime
            });

            return new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: 'E_AMOUNT_MISMATCH',
                        message: `Expected ${amount}, got ${tossData.totalAmount}`
                    }
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. 결제 기록 저장 (멱등성 보장)
        const { error: paymentError } = await supabase.from('payments').upsert(
            {
                provider: 'toss',
                provider_tx_id: paymentKey,
                enrollment_id: '', // 아래에서 업데이트
                amount_cents: tossData.totalAmount,
                currency_code: tossData.currency,
                tax_amount_cents: tossData.vat || 0,
                status: 'PAID',
                paid_at: tossData.approvedAt,
                raw: tossData,
                created_at: new Date().toISOString()
            },
            {
                onConflict: 'provider,provider_tx_id'
            }
        );

        if (paymentError) {
            logEvent({
                request_id: requestId,
                function_name: 'confirm-payment',
                provider: 'toss',
                provider_tx_id: paymentKey,
                user_id: userId,
                course_id: courseId,
                status: 'PAYMENT_SAVE_FAILED',
                error_code: 'E_PAYMENT_SAVE_FAILED',
                latency_ms: Date.now() - startTime
            });

            return new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: 'E_PAYMENT_SAVE_FAILED',
                        message: paymentError.message
                    }
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. 수강신청 생성
        const { data: enrollment, error: enrollmentError } = await supabase
            .from('enrollments')
            .insert({
                course_id: courseId,
                user_id: userId,
                status: 'ENROLLED',
                source: 'purchase',
                enrolled_at: new Date().toISOString()
            })
            .select()
            .single();

        if (enrollmentError || !enrollment) {
            logEvent({
                request_id: requestId,
                function_name: 'confirm-payment',
                provider: 'toss',
                provider_tx_id: paymentKey,
                user_id: userId,
                course_id: courseId,
                status: 'ENROLLMENT_FAILED',
                error_code: 'E_ENROLL_CREATE_FAILED',
                latency_ms: Date.now() - startTime
            });

            return new Response(
                JSON.stringify({
                    success: false,
                    error: {
                        code: 'E_ENROLL_CREATE_FAILED',
                        message: enrollmentError?.message || 'Enrollment creation failed'
                    }
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 5. 결제 기록에 enrollment_id 업데이트
        const { error: updateError } = await supabase.from('payments').update({ enrollment_id: enrollment.id }).eq('provider_tx_id', paymentKey);

        if (updateError) {
            // 이미 enrollment은 생성되었으므로 로그만 남기고 성공 처리
            logEvent({
                request_id: requestId,
                function_name: 'confirm-payment',
                provider: 'toss',
                provider_tx_id: paymentKey,
                enrollment_id: enrollment.id,
                user_id: userId,
                course_id: courseId,
                status: 'PAYMENT_UPDATE_WARNING',
                error_code: 'E_PAYMENT_UPDATE_FAILED',
                latency_ms: Date.now() - startTime
            });
        }

        // 성공 로그
        logEvent({
            request_id: requestId,
            function_name: 'confirm-payment',
            provider: 'toss',
            provider_tx_id: paymentKey,
            enrollment_id: enrollment.id,
            user_id: userId,
            course_id: courseId,
            status: 'SUCCESS',
            latency_ms: Date.now() - startTime
        });

        return new Response(
            JSON.stringify({
                success: true,
                enrollmentId: enrollment.id
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        logEvent({
            request_id: requestId,
            function_name: 'confirm-payment',
            status: 'INTERNAL_ERROR',
            error_code: 'E_INTERNAL_ERROR',
            latency_ms: Date.now() - startTime
        });

        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    code: 'E_INTERNAL_ERROR',
                    message: 'Internal server error'
                }
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

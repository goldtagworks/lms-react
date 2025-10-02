/**
 * [schema-sync] Toss Payments 결제 서비스 - Edge Function 연동
 *
 * Copilot Instructions 준수:
 * - 클라이언트 금지: 임의 price_cents 계산, enrollment 직접 UPDATE
 * - 멱등성: (provider,provider_tx_id) unique 보장
 * - 에러 코드 표준화: E_AMOUNT_MISMATCH, E_CURRENCY_MISMATCH 등
 * - 보안: 결제 승인은 Edge Function을 통해 서버에서 처리
 */

import type { TossPaymentRequest, PaymentFlow } from '@main/types/payment';
import type { EPPResult } from '@main/features/payments/epp';

import { loadTossPayments } from '@tosspayments/payment-sdk';

// 환경 변수 (개발/운영 분리)
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';

// 도메인 설정
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5173';
const SUCCESS_URL = `${BASE_URL}/payment/success`;
const FAIL_URL = `${BASE_URL}/payment/fail`;

// Edge Function URL
const CONFIRM_PAYMENT_URL = `${SUPABASE_URL}/functions/v1/confirm-payment`;

// 서명 생성 (향후 실제 HMAC 구현)
function generateSignature(timestamp: string, _body: string): string {
    // TODO: 실제 HMAC-SHA256 서명 구현
    // const secret = import.meta.env.VITE_WEBHOOK_SECRET;
    // return hmacSha256(secret, timestamp + body);
    return `mock_signature_${timestamp}`;
}

class TossPaymentService {
    private tossPayments: any = null;

    async initialize() {
        if (!this.tossPayments) {
            this.tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        }

        return this.tossPayments;
    }

    /**
     * 주문 ID 생성 (멱등성 보장)
     */
    generateOrderId(courseId: string, userId: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);

        return `order_${courseId}_${userId}_${timestamp}_${random}`;
    }

    /**
     * 결제 요청 (토스 결제창 호출)
     */
    async requestPayment(params: { course: { id: string; title: string }; user: { id: string; name?: string; email?: string }; epp: EPPResult }): Promise<PaymentFlow> {
        try {
            await this.initialize();

            const orderId = this.generateOrderId(params.course.id, params.user.id);

            const paymentRequest: TossPaymentRequest = {
                amount: params.epp.final_amount_cents,
                orderId,
                orderName: `${params.course.title} 수강신청`,
                customerName: params.user.name,
                customerEmail: params.user.email,
                successUrl: SUCCESS_URL,
                failUrl: FAIL_URL
            };

            // 결제 프로세스 상태 초기화
            const paymentFlow: PaymentFlow = {
                step: 'INIT',
                orderId,
                amount: params.epp.final_amount_cents,
                course: params.course,
                user: params.user,
                epp: {
                    original_price_cents: params.epp.original_price_cents,
                    final_amount_cents: params.epp.final_amount_cents,
                    discount_amount_cents: params.epp.discount_amount_cents,
                    applied_coupon: params.epp.applied_coupon?.code
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 로컬 스토리지에 결제 정보 임시 저장
            localStorage.setItem(`payment_${orderId}`, JSON.stringify(paymentFlow));

            // 토스 결제창 호출
            await this.tossPayments.requestPayment('카드', paymentRequest);

            // 이 지점에 도달하면 사용자가 결제창을 닫았거나 에러 발생
            return {
                ...paymentFlow,
                step: 'FAILED',
                error: { code: 'USER_CANCEL', message: '사용자가 결제를 취소했습니다.' },
                updatedAt: new Date().toISOString()
            };
        } catch (error: any) {
            return {
                step: 'FAILED',
                orderId: '',
                amount: params.epp.final_amount_cents,
                course: params.course,
                user: params.user,
                error: {
                    code: error.code || 'PAYMENT_REQUEST_FAILED',
                    message: error.message || '결제 요청 중 오류가 발생했습니다.'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
    }

    /**
     * 결제 승인 (Edge Function을 통해 서버에서 처리)
     */
    async confirmPayment(params: { paymentKey: string; orderId: string; amount: number; courseId: string; userId: string }): Promise<{
        success: boolean;
        enrollmentId?: string;
        error?: { code: string; message: string };
    }> {
        try {
            const timestamp = Math.floor(Date.now() / 1000).toString();
            const body = JSON.stringify(params);
            const signature = generateSignature(timestamp, body);

            const response = await fetch(CONFIRM_PAYMENT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signature,
                    'X-Timestamp': timestamp
                },
                body
            });

            if (!response.ok) {
                const errorData = await response.json();

                return {
                    success: false,
                    error: {
                        code: errorData.error?.code || 'EDGE_FUNCTION_ERROR',
                        message: errorData.error?.message || 'Edge Function 호출 실패'
                    }
                };
            }

            const result = await response.json();

            return result;
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error.message || '네트워크 오류가 발생했습니다.'
                }
            };
        }
    }

    /**
     * 결제 성공 처리 (Edge Function 호출 방식으로 변경)
     */
    async handlePaymentSuccess(paymentKey: string, orderId: string, amount: number): Promise<boolean> {
        try {
            // 1. 로컬 스토리지에서 결제 정보 복원
            const storedData = localStorage.getItem(`payment_${orderId}`);

            if (!storedData) {
                throw new Error('E_ORDER_NOT_FOUND: 주문 정보를 찾을 수 없습니다.');
            }

            const paymentFlow: PaymentFlow = JSON.parse(storedData);

            // 2. 금액 검증 (클라이언트 레벨 사전 체크)
            if (paymentFlow.amount !== amount) {
                throw new Error(`E_AMOUNT_MISMATCH: Expected ${paymentFlow.amount}, got ${amount}`);
            }

            // 3. Edge Function을 통한 결제 승인 및 DB 처리
            const result = await this.confirmPayment({
                paymentKey,
                orderId,
                amount,
                courseId: paymentFlow.course.id,
                userId: paymentFlow.user.id
            });

            if (result.success) {
                // 4. 임시 데이터 정리
                localStorage.removeItem(`payment_${orderId}`);

                return true;
            } else {
                throw new Error(result.error?.message || '결제 승인에 실패했습니다.');
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('[PaymentService] handlePaymentSuccess failed:', error);

            return false;
        }
    }

    /**
     * 결제 실패 처리
     */
    async handlePaymentFail(orderId: string, _code: string, _message: string): Promise<void> {
        try {
            // 로컬 스토리지 정리
            localStorage.removeItem(`payment_${orderId}`);
        } catch {
            // 에러 처리 (로깅은 실제 서비스에서 별도 구현)
        }
    }
}

// 싱글톤 인스턴스
export const tossPaymentService = new TossPaymentService();

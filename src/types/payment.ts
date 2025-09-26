/**
 * 결제 상태
 */
export const PaymentStatus = ['PAID', 'FAILED', 'REFUNDED'] as const;
/**
 * 결제 상태 타입
 */
export type PaymentStatus = (typeof PaymentStatus)[number];

/**
 * 결제 정보
 */
export interface Payment {
    /** 결제 고유 ID */
    id: string;
    /** 수강신청 ID */
    enrollment_id: string;
    /** 결제 PG/수단 */
    provider: string;
    /** PG 거래 ID */
    provider_tx_id: string;
    /** 결제 금액(원) */
    amount_cents: number;
    /** 통화(ISO 4217) */
    currency_code: string;
    /** 세금액(원) */
    tax_amount_cents: number;
    /** 세율(%) */
    tax_rate_percent?: number;
    /** 과세국가(ISO 3166-1 alpha-2) */
    tax_country_code?: string;
    /** 결제 상태 */
    status: PaymentStatus;
    /** 결제 완료일(옵션) */
    paid_at?: string;
    /** 원본 응답(jsonb, 옵션) */
    raw?: any;
    /** 생성일 */
    created_at: string;
}

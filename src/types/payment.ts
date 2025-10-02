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

// ============================================================
// Toss Payments API 타입 정의
// ============================================================

// 결제 요청 시 필요한 정보
export interface TossPaymentRequest {
    amount: number;
    orderId: string;
    orderName: string;
    customerName?: string;
    customerEmail?: string;
    customerMobilePhone?: string;
    successUrl: string;
    failUrl: string;
    flowMode?: 'DEFAULT' | 'DIRECT';
    easyPay?: {
        discountCode?: string;
    };
    card?: {
        useEscrow?: boolean;
        flowMode?: 'DEFAULT' | 'DIRECT';
        useCardPoint?: boolean;
        useAppCardOnly?: boolean;
    };
}

// 토스 결제 승인 응답
export interface TossPaymentResponse {
    paymentKey: string;
    type: 'NORMAL' | 'BILLING' | 'BRANDPAY';
    orderId: string;
    orderName: string;
    mId: string;
    currency: string;
    method: 'card' | 'virtualAccount' | 'transfer' | 'mobilePhone' | 'giftCertificate' | 'easyPay';
    totalAmount: number;
    balanceAmount: number;
    status: 'READY' | 'IN_PROGRESS' | 'WAITING_FOR_DEPOSIT' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';
    requestedAt: string;
    approvedAt?: string;
    useEscrow: boolean;
    lastTransactionKey?: string;
    suppliedAmount: number;
    vat: number;
    isPartialCancelable: boolean;
    card?: {
        amount: number;
        issuerCode: string;
        acquirerCode?: string;
        number: string;
        installmentPlanMonths: number;
        approveNo: string;
        useCardPoint: boolean;
        cardType: 'credit' | 'debit' | 'gift';
        ownerType: 'personal' | 'company';
        acquireStatus: 'READY' | 'REQUESTED' | 'COMPLETED' | 'CANCEL_REQUESTED' | 'CANCELED';
        isInterestFree: boolean;
        interestPayer?: 'BUYER' | 'CARD_COMPANY' | 'MERCHANT';
    };
    failure?: {
        code: string;
        message: string;
    };
}

// 결제 승인 요청
export interface TossConfirmRequest {
    paymentKey: string;
    orderId: string;
    amount: number;
}

// Toss Payments 에러 응답
export interface TossErrorResponse {
    code: string;
    message: string;
}

// 결제 프로세스 상태
export interface PaymentFlow {
    step: 'INIT' | 'REQUESTED' | 'CONFIRMING' | 'COMPLETED' | 'FAILED';
    orderId: string;
    paymentKey?: string;
    amount: number;
    course: {
        id: string;
        title: string;
    };
    user: {
        id: string;
        name?: string;
        email?: string;
    };
    epp?: {
        original_price_cents: number;
        final_amount_cents: number;
        discount_amount_cents: number;
        applied_coupon?: string;
    };
    error?: TossErrorResponse;
    createdAt: string;
    updatedAt: string;
}

/**
 * 쿠폰 할인 유형
 */
export const CouponDiscountType = ['percent', 'fixed'] as const;
/**
 * 쿠폰 할인 유형 타입
 */
export type CouponDiscountType = (typeof CouponDiscountType)[number];

/**
 * 쿠폰 정보
 */
export interface Coupon {
    /** 쿠폰 고유 ID */
    id: string;
    /** 쿠폰 코드 */
    code: string;
    /** 할인 유형(enum) */
    discount_type: CouponDiscountType;
    /** 퍼센트 할인율(옵션) */
    percent?: number;
    /** 정액 할인액(옵션, 원) */
    amount_cents?: number;
    /** 시작일(옵션) */
    starts_at?: string;
    /** 종료일(옵션) */
    ends_at?: string;
    /** 전체 사용 한도(옵션) */
    max_redemptions?: number;
    /** 1인당 사용 한도(옵션) */
    per_user_limit?: number;
    /** 활성화 여부 */
    is_active: boolean;
    /** 생성일 */
    created_at: string;
}

/**
 * 쿠폰 사용 내역
 */
export interface CouponRedemption {
    /** 사용 내역 고유 ID */
    id: string;
    /** 쿠폰 ID */
    coupon_id: string;
    /** 사용자 ID */
    user_id: string;
    /** 수강신청 ID(옵션) */
    enrollment_id?: string;
    /** 사용일 */
    redeemed_at: string;
}

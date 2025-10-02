/**
 * [schema-sync] EPP (Effective Price Point) 계산 로직
 *
 * Copilot Instructions #5: 결제 EPP 계산 요약
 * - 세일 유효 → 세일가; 쿠폰 percent → fixed 순 적용 후 최소 0;
 * - tax_included=false면 세금 가산; 통화 불일치 즉시 오류.
 *
 * 서버 권위적 계산 원칙: 클라이언트는 표시만, 실제 계산은 서버에서
 */

export interface CoursePrice {
    price_cents: number;
    sale_price_cents: number | null;
    sale_ends_at: string | null;
    currency: string;
    tax_included: boolean;
}

export interface CouponInfo {
    code: string;
    discount_type: 'percent' | 'fixed';
    percent: number | null;
    amount_cents: number | null;
    currency: string;
}

export interface TaxInfo {
    rate_percent: number;
    country_code: string;
}

export interface EPPResult {
    original_price_cents: number;
    effective_price_cents: number;
    discount_amount_cents: number;
    tax_amount_cents: number;
    final_amount_cents: number;
    currency: string;
    applied_coupon?: CouponInfo;
    tax_info?: TaxInfo;
    breakdown: {
        base_price: number;
        sale_discount: number;
        coupon_discount: number;
        subtotal: number;
        tax: number;
        total: number;
    };
}

/**
 * EPP 계산 - 서버 계산 값 (클라이언트는 표시 전용)
 */
export function calculateEPP(course: CoursePrice, coupon?: CouponInfo, taxInfo?: TaxInfo): EPPResult {
    // 1. 통화 일치 검증
    if (coupon && coupon.currency !== course.currency) {
        throw new Error(`E_CURRENCY_MISMATCH: Coupon currency ${coupon.currency} != Course currency ${course.currency}`);
    }

    // 2. 기본 가격 결정 (세일 우선)
    const now = new Date();
    const saleActive = course.sale_ends_at && new Date(course.sale_ends_at) > now;
    const basePrice = saleActive && course.sale_price_cents !== null ? course.sale_price_cents : course.price_cents;

    let effectivePrice = basePrice;
    let discountAmount = 0;
    let saleDiscount = 0;
    let couponDiscount = 0;

    // 세일 할인 계산
    if (saleActive && course.sale_price_cents !== null) {
        saleDiscount = course.price_cents - course.sale_price_cents;
    }

    // 3. 쿠폰 적용 (percent → fixed 순서)
    if (coupon) {
        if (coupon.discount_type === 'percent' && coupon.percent !== null) {
            couponDiscount = Math.floor(effectivePrice * (coupon.percent / 100));
        } else if (coupon.discount_type === 'fixed' && coupon.amount_cents !== null) {
            couponDiscount = coupon.amount_cents;
        }

        // 최소 0원 보장
        effectivePrice = Math.max(0, effectivePrice - couponDiscount);
        discountAmount = saleDiscount + couponDiscount;
    } else {
        discountAmount = saleDiscount;
    }

    // 4. 세금 계산
    let taxAmount = 0;
    let finalAmount = effectivePrice;

    if (taxInfo && !course.tax_included) {
        taxAmount = Math.floor(effectivePrice * (taxInfo.rate_percent / 100));
        finalAmount = effectivePrice + taxAmount;
    } else if (course.tax_included && taxInfo) {
        // 이미 포함된 세금 계산 (역산)
        taxAmount = Math.floor(effectivePrice * (taxInfo.rate_percent / (100 + taxInfo.rate_percent)));
    }

    return {
        original_price_cents: course.price_cents,
        effective_price_cents: effectivePrice,
        discount_amount_cents: discountAmount,
        tax_amount_cents: taxAmount,
        final_amount_cents: finalAmount,
        currency: course.currency,
        applied_coupon: coupon,
        tax_info: taxInfo,
        breakdown: {
            base_price: basePrice,
            sale_discount: saleDiscount,
            coupon_discount: couponDiscount,
            subtotal: effectivePrice,
            tax: taxAmount,
            total: finalAmount
        }
    };
}

/**
 * 가격 표시용 유틸리티 (서버 계산 결과 표시)
 */
export function formatPrice(cents: number, currency = 'KRW'): string {
    if (currency === 'KRW') {
        return `₩${cents.toLocaleString()}`;
    }

    return `${currency} ${(cents / 100).toFixed(2)}`;
}

/**
 * 할인율 계산
 */
export function calculateDiscountPercent(originalPrice: number, finalPrice: number): number {
    if (originalPrice <= 0) return 0;

    return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

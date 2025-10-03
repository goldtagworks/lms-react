// Server-side EPP recalculation (subset)
export interface CoursePricingRow {
  list_price_cents: number;
  sale_price_cents: number | null;
  sale_ends_at: string | null;
  currency_code: string;
  tax_included: boolean;
  tax_rate_percent: number | null;
}

export interface CouponRow {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  percent: number | null;
  amount_cents: number | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface RecalcResult {
  base: number;
  discount: number;
  final: number;
  tax: number;
  total: number;
  currency: string;
}

export function recomputeEPP(course: CoursePricingRow, coupon?: CouponRow): RecalcResult {
  const now = Date.now();
  const saleActive = !!(course.sale_price_cents && course.sale_ends_at && new Date(course.sale_ends_at).getTime() > now);
  const base = saleActive && course.sale_price_cents ? Math.min(course.list_price_cents, course.sale_price_cents) : course.list_price_cents;

  let working = base;
  let discount = 0;

  if (coupon) {
    // validity window
    if ((coupon.starts_at && new Date(coupon.starts_at).getTime() > now) || (coupon.ends_at && new Date(coupon.ends_at).getTime() < now)) {
      // ignore expired / not started
    } else {
      if (coupon.discount_type === 'percent' && coupon.percent) {
        const c = Math.floor(working * (coupon.percent / 100));
        working = Math.max(0, working - c);
        discount += c;
      } else if (coupon.discount_type === 'fixed' && coupon.amount_cents) {
        const c = coupon.amount_cents;
        working = Math.max(0, working - c);
        discount += c;
      }
    }
  }

  let tax = 0;
  let total = working;
  if (!course.tax_included && course.tax_rate_percent) {
    tax = Math.floor(working * (course.tax_rate_percent / 100));
    total += tax;
  }

  return { base, discount, final: working, tax, total, currency: course.currency_code };
}

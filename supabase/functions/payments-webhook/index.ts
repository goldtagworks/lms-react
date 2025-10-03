/**
 * payments-webhook Edge Function
 * Responsibilities:
 * 1. HMAC 검증 (X-Signature, X-Timestamp 300s 이내)
 * 2. Idempotency(scope=payment, key=provider+tx) 조회/삽입
 * 3. Course + (optional coupon) 서버 EPP 재계산 & 금액/통화 검증
 * 4. mismatch → 표준 에러 코드 반환(E_AMOUNT_MISMATCH/E_CURRENCY_MISMATCH)
 * 5. Enrollment 상태 PENDING → ENROLLED 멱등 전이
 *
 * Concurrency Risks & Mitigations:
 * - 중복 웹훅: idempotency_keys PK(scope,key_hash) + early return
 * - Race (결제 vs 수동 등록): enrollment unique(user_id,course_id) & 상태 전이 UPDATE ... WHERE status='PENDING'
 * - Replay Attack: signature + timestamp window(5분) + (선택) 추가 재사용 캐시 가능
 */

import { verifySignature } from '../_shared/signature.ts';
import { errorResponse, ok, ERR } from '../_shared/errors.ts';
import { recomputeEPP } from '../_shared/epp.ts';
import { reserveIdempotent, finalizeIdempotent } from '../_shared/idempotency.ts';
import { logEvent, genRequestId } from '../_shared/log.ts';

// 환경 변수 (Supabase Edge Runtime: Deno) - 비밀키는 Service Role Key
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // 함수 배포 시 주입 필요
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

interface WebhookPayload {
  provider: string;
  provider_tx_id: string;
  enrollment_id: string; // (optional if you pass course_id + user_id)
  course_id?: string;
  user_id?: string;
  amount_cents: number;
  currency_code: string;
  coupon_code?: string;
}

async function fetchCourse(courseId: string) {
  const { data, error } = await supabase
    .from('courses')
    .select('id,list_price_cents,sale_price_cents,sale_ends_at,currency_code,tax_included,tax_rate_percent')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchCoupon(code: string) {
  const { data } = await supabase
    .from('coupons')
    .select('id,code,discount_type,percent,amount_cents,is_active,starts_at,ends_at')
    .eq('code', code)
    .maybeSingle();
  return data;
}

async function fetchEnrollment(enrollmentId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select('id,status,user_id,course_id')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

Deno.serve(async (req) => {
  const started = performance.now();
  const request_id = genRequestId();
  logEvent({ event: 'payments_webhook_start', request_id });
  const timestamp = req.headers.get('x-timestamp');
  const signature = req.headers.get('x-signature');
  const raw = await req.text();

  if (!(await verifySignature(raw, signature, timestamp, WEBHOOK_SECRET, 'payments-webhook'))) {
    logEvent({ event: 'sig_invalid', request_id, reason: 'verify_failed' });
    return errorResponse(ERR.WEBHOOK_INVALID_SIG, 'Invalid signature', 400);
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    logEvent({ event: 'payload_invalid', request_id });
    return errorResponse(ERR.PAYLOAD_INVALID, 'Invalid JSON payload', 400);
  }

  // Idempotency reserve
  const idemKey = `${payload.provider}_${payload.provider_tx_id}`;
  const reservation = await reserveIdempotent(SUPABASE_URL, SERVICE_KEY, 'payment', idemKey);
  if (reservation.cached) {
    logEvent({ event: 'duplicate', request_id, idem_key: idemKey });
    return ok({ status: 'duplicate', cached: true, result: reservation.result });
  }

  // Enrollment 로드
  const enrollment = await fetchEnrollment(payload.enrollment_id);
  if (!enrollment) {
    logEvent({ event: 'error', request_id, code: ERR.ENROLL_NOT_FOUND });
    return errorResponse(ERR.ENROLL_NOT_FOUND, 'Enrollment not found', 404);
  }

  const course = await fetchCourse(enrollment.course_id);
  if (!course) {
    logEvent({ event: 'error', request_id, code: ERR.COURSE_NOT_FOUND });
    return errorResponse(ERR.COURSE_NOT_FOUND, 'Course not found', 404);
  }

  // 서버 재계산
  const coupon = payload.coupon_code ? await fetchCoupon(payload.coupon_code) : null;
  const nowMs = Date.now();
  if (payload.coupon_code && !coupon) {
    logEvent({ event: 'coupon_invalid', request_id, code: payload.coupon_code });
    return errorResponse(ERR.COUPON_INVALID, 'Coupon invalid', 422);
  }
  if (coupon) {
    if (!coupon.is_active) {
      logEvent({ event: 'coupon_inactive', request_id, code: coupon.code });
      return errorResponse(ERR.COUPON_INACTIVE, 'Coupon inactive', 422);
    }
    const startsOk = !coupon.starts_at || new Date(coupon.starts_at).getTime() <= nowMs;
    const endsOk = !coupon.ends_at || new Date(coupon.ends_at).getTime() >= nowMs;
    if (!startsOk) {
      logEvent({ event: 'coupon_not_started', request_id, code: coupon.code });
      return errorResponse(ERR.COUPON_NOT_STARTED, 'Coupon not started', 422);
    }
    if (!endsOk) {
      logEvent({ event: 'coupon_expired', request_id, code: coupon.code });
      return errorResponse(ERR.COUPON_EXPIRED, 'Coupon expired', 422);
    }
  }
  const epp = recomputeEPP(course, coupon || undefined);

  // 금액/통화 검증
  if (epp.total !== payload.amount_cents) {
    logEvent({ event: 'amount_mismatch', request_id, expected: epp.total, got: payload.amount_cents });
    return errorResponse(ERR.AMOUNT_MISMATCH, `Amount mismatch expected=${epp.total} got=${payload.amount_cents}`, 422);
  }
  if (course.currency_code !== payload.currency_code) {
    logEvent({ event: 'currency_mismatch', request_id, expected: course.currency_code, got: payload.currency_code });
    return errorResponse(ERR.CURRENCY_MISMATCH, `Currency mismatch expected=${course.currency_code} got=${payload.currency_code}`, 422);
  }

  // payments insert (unique constraint handles dup)
  const { error: payErr } = await supabase.from('payments').insert({
    enrollment_id: enrollment.id,
    provider: payload.provider,
    provider_tx_id: payload.provider_tx_id,
    amount_cents: payload.amount_cents,
    currency_code: payload.currency_code,
    status: 'PAID',
    paid_at: new Date().toISOString(),
    raw: payload
  });
  if (payErr && !payErr.message.includes('duplicate key')) {
    logEvent({ event: 'payment_insert_error', request_id, error: payErr.message });
    return errorResponse(ERR.PAYMENT_INSERT, payErr.message, 500);
  }

  // Enrollment 전이 (PENDING -> ENROLLED)
  if (enrollment.status === 'PENDING') {
    const { error: updErr } = await supabase
      .from('enrollments')
      .update({ status: 'ENROLLED', source: 'purchase' })
      .eq('id', enrollment.id)
      .eq('status', 'PENDING');
    if (updErr) {
      logEvent({ event: 'enroll_update_error', request_id, error: updErr.message });
      return errorResponse(ERR.ENROLL_UPDATE, updErr.message, 500);
    }
  }

  // 최종 idempotent 결과 저장 (first_result upsert)
  await finalizeIdempotent(SUPABASE_URL, SERVICE_KEY, 'payment', reservation.key_hash, { enrollment_id: enrollment.id, status: 'ENROLLED' });
  const latency_ms = Math.round(performance.now() - started);
  logEvent({ event: 'payments_webhook_success', request_id, enrollment_id: enrollment.id, latency_ms });
  return ok({ status: 'ENROLLED', enrollment_id: enrollment.id, request_id, latency_ms });
});

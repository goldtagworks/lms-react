/**
 * Standardized error codes & response helpers for Edge Functions
 * 
 * Usage:
 * - Import: import { ERR, errorResponse, ok } from '../_shared/errors.ts';
 * - Error: return errorResponse(ERR.AMOUNT_MISMATCH, 'Amount mismatch', 422);
 * - Success: return ok({ status: 'ENROLLED', enrollment_id });
 * 
 * i18n Integration:
 * - All error codes should have corresponding keys in 051_copy_catalog.json
 * - Format: errors.E_WEBHOOK_INVALID_SIG, errors.E_AMOUNT_MISMATCH, etc.
 * - Frontend can map error.code to t(`errors.${error.code}`) for localized messages
 */

// Error code constants (i18n prefix: errors.*)
export const ERR = {
  // Webhook & Authentication
  WEBHOOK_INVALID_SIG: 'E_WEBHOOK_INVALID_SIG',
  SIGNATURE_REPLAY: 'E_SIGNATURE_REPLAY',
  PAYLOAD_INVALID: 'E_PAYLOAD_INVALID',
  
  // Payment & Pricing
  AMOUNT_MISMATCH: 'E_AMOUNT_MISMATCH',
  CURRENCY_MISMATCH: 'E_CURRENCY_MISMATCH',
  DUP_TX: 'E_DUP_TX',
  PAYMENT_INSERT: 'E_PAYMENT_INSERT',
  
  // Enrollment & Course
  ENROLL_NOT_FOUND: 'E_ENROLL_NOT_FOUND',
  ENROLL_UPDATE: 'E_ENROLL_UPDATE', 
  COURSE_NOT_FOUND: 'E_COURSE_NOT_FOUND',
  
  // Coupon Validation
  COUPON_INVALID: 'E_COUPON_INVALID',
  COUPON_NOT_STARTED: 'E_COUPON_NOT_STARTED',
  COUPON_EXPIRED: 'E_COUPON_EXPIRED',
  COUPON_INACTIVE: 'E_COUPON_INACTIVE'
} as const;

export type ErrorCode = typeof ERR[keyof typeof ERR];

/**
 * Standard error response for Edge Functions
 * Returns JSON { code, message } with appropriate HTTP status
 */
export function errorResponse(code: ErrorCode, message: string, status = 400): Response {
  return new Response(JSON.stringify({ code, message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Standard success response for Edge Functions
 * Returns JSON body with 200 status (or custom)
 */
export function ok<T extends Record<string, any>>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

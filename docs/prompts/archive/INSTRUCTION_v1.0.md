---
version: 1.0
stage: foundation+edge+ui+design+payment
source_steps: [1,2,3,4,5,6]
audience: dev+ai
updated: 2025-09-26
supersedes: INSTRUCTION_v0.95.md
scope: "Core + Edge + UI + Design + Payment(EPP/Errors/Webhooks)"
next_release_target: v1.1
---
# Instruction v1.0 (Payment Integrated)
> ⚠️ 이 문서는 v1.1(`INSTRUCTION_v1.1.md`)으로 대체되었습니다. 시험/수료/안티치트 관련 최신 내용은 v1.1 참고.
> v0.95에 결제 상태머신, EPP(금액 계산), 웹훅 검증/에러/UX 가드/모니터링 반영. 시험/수료 Anti-cheat & 품질 게이트/감리(OpenAPI/Gherkin)는 다음 릴리즈(1.1) 범위.

## 1. 결제 상태머신 (Enrollment)
상태: PENDING → ENROLLED → CANCELLED
전이: pay_succeeded_webhook | grant_free | grant_subscription | cancel
불변식: FE는 ENROLLED 직접 설정 금지, 멱등 키 (provider,provider_tx_id)

## 2. 가격/EPP 계산
순서: base(list or sale) → coupon(percent→fixed) → clamp ≥0 → tax(add if tax_included=false) → currency match.

Pseudo:
```ts
function computeEPP(course, coupon?, now=Date.now()): ComputedPrice {
  const base = course.sale_price_cents && now < sale_ends_at ? course.sale_price_cents : course.list_price_cents;
  let discounted = base;
  if (coupon) {
    if (coupon.percent) discounted = Math.round(discounted * (1 - coupon.percent/100));
    if (coupon.amount_cents) discounted = discounted - coupon.amount_cents;
    discounted = Math.max(discounted, 0);
  }
  let taxAmount = 0;
  if (!course.tax_included && course.tax_rate_percent) {
    taxAmount = Math.round(discounted * (course.tax_rate_percent/100));
  }
  return { basePrice: base, finalPrice: discounted + taxAmount, discount: base - discounted, taxAmount };
}
```
검증(웹훅): amount==finalPrice, currency==course.currency_code → mismatch → 에러.

## 3. Edge.payments-webhook (확장)
추가 필드: course_id, user_id, coupon_code.
검증 순서: 서명 → 존재/매칭 → 금액(EPP) → 통화 → 세금(optional) → 쿠폰 재검증 → upsert + 상태 전이.

## 4. 결제 UX 가드 (FE)
| 상황 | UI | Timeout |
|------|----|---------|
| 결제 직후 | processing 배너 | 0s |
| 30s 웹훅 미도착 | delayed 배너 | +30s |
| 취소 | pay.cancelled 토스트 | 즉시 |
| 중복 | pay.duplicate 안내 | 즉시 |
| 오류(E_AMOUNT_MISMATCH 등) | pay.error + support 안내 | 즉시 |

## 5. 에러 코드 갱신 (Payment)
| 코드 | 의미 | HTTP | UX |
|------|------|------|----|
| E_PG_CANCEL | 위젯 취소 | 200 | 안내 후 원 화면 |
| E_PG_TIMEOUT | 위젯 지연 | 200 | delayed 배너 |
| E_DUP_TX | 중복 tx | 200 | 안내 |
| E_WEBHOOK_INVALID_SIG | 서명 오류 | 400 | 오류 안내 |
| E_ENROLL_NOT_FOUND | 잘못된 enrollment | 404 | 오류 안내 |
| E_AMOUNT_MISMATCH | 금액 불일치 | 422 | 오류 안내 |
| E_CURRENCY_MISMATCH | 통화 불일치 | 422 | 오류 |
| E_TAX_MISMATCH | 세금 불일치 | 422 | 오류 |
| E_COUPON_INVALID | 쿠폰 무효 | 422 | 쿠폰 오류 |
| E_COUPON_EXPIRED | 쿠폰 만료 | 422 | 쿠폰 만료 |
| E_PRICE_STALE | 가격 만료 | 409 | 새 가격 재표시 |
| E_PROVIDER_DOWN | PG 장애 | 503 | 점검 안내 |
| E_NETWORK | 네트워크 | - | 재시도 |

## 6. 모니터링 & 알람
- 5분 내 E_WEBHOOK_INVALID_SIG ≥3 → 경보
- E_AMOUNT_MISMATCH / E_CURRENCY_MISMATCH 발생 → 즉시 경보
- paid 처리 지연(30s+) 건수 >5 → 주의
- 구독 past_due 비율 >5% → 경보

로그 구조:
```json
{
  "ts":"ISO", "request_id":"...", "fn":"payments-webhook",
  "provider":"portone", "provider_tx_id":"...", "enrollment_id":"...",
  "course_id":"...", "user_id":"...", "amount":12300, "currency":"KRW",
  "status":"paid", "result":"enrolled" | "duplicate" | "mismatch" | "error",
  "error_code": null
}
```

## 7. 테스트 수용 기준(결제)
AC1~AC8 (070) + 추가:
- AC9: 가격 만료 시(세일 종료) E_PRICE_STALE 수신 → 최신 가격 UI 재요청.
- AC10: 쿠폰 만료 즉시 coupon.expired 메시지.
- AC11: 중복 tx 재전송 시 단 1회만 ENROLLED.
- AC12: provider down 시 재시도 버튼 + support 링크.

## 8. 스크립트/도구 TODO (v1.1)
| 항목 | 목적 |
|------|------|
| gen:openapi | Edge 스펙 JSON 생성 |
| test:payment | EPP/쿠폰/세금 경계 테스트 |
| seed:payment | 데모 enrollment/payment 시드 |
| watch:anomaly | 로그 스트림 분석 → 경보 |

## 9. 릴리즈 노트 (v1.0 변경점)
- UI/Design/Copy 통합 + 결제 상태머신/EPP/웹훅 에러 표준 수립
- 에러 코드 세트 확정(결제 영역)
- EPP 계산 공식 초안 포함

## 10. 남은 범위 (v1.1 예정)
| 카테고리 | 작업 |
|----------|------|
| Exam Anti-cheat | 포커스 이탈/쿨다운/재응시 정책 문서화 |
| Certificate | PDF 템플릿/시리얼 시퀀스 구현 세부 |
| Quality Gate | a11y/mobile/coverage CI 명령 확정 |
| OpenAPI & Gherkin | edges.openapi.json + 3 Gherkin (결제/구독/쿠폰) |
| Idempotency Keys | idempotency_keys 테이블 & job |
| Price Engine | 환율/다통화 확장(미정) |

## 11. Definition of Done (v1.0)
| 항목 | 기준 |
|------|------|
| 결제 상태 UX | processing→(delayed)→enrolled/failed 흐름 시뮬레이션 |
| 금액 검증 | 정상/불일치/세일만료/쿠폰만료 테스트 통과 |
| 멱등 | 중복 provider_tx_id 처리 200 no-op |
| 로그 | 샘플 로그 구조 출력 |
| 에러 매핑 | i18n errors.* 키 전부 존재 |

---
Instruction v1.0 끝. 다음 버전(v1.1)에서 시험/수료/품질/Audit 통합 예정.

# 070_payment_flow — 결제 플로우 & 상태머신 (v3.4)

본 문서는 결제 시작부터 수강 활성화(ENROLLED)까지의 **상태 전이, 시퀀스, 예외 처리, 멱등성, 금액검증(세일/쿠폰/세금/통화), 구독 플로우, UX 가드, 모니터링, 테스트 수용 기준**을 명시한다. 이 계약을 준수하지 않으면 배포 불가.

────────────────────────────────────────────────────
## 1) 용어 및 역할
- Student: 결제 주체(웹/모바일 브라우저)
- Frontend: React 클라이언트(위젯 호출/상태 안내)
- PG: 결제 게이트웨이(PortOne/Toss/Stripe 등)
- Edge.payments-webhook: 단건 결제 웹훅 처리
- Edge.subscriptions-webhook: 구독(정액제) 웹훅 처리
- Edge.coupons-validate: 쿠폰 검증 API
- DB: Supabase(courses/enrollments/payments/coupons/user_subscriptions)

────────────────────────────────────────────────────
## 2) 상태머신 (enrollment)

상태: `PENDING → ENROLLED → CANCELLED`

전이 규칙
- `pay_succeeded_webhook`: PENDING → ENROLLED (웹훅만 허용, source='purchase')
- `grant_free`: PENDING → ENROLLED (프런트/서버, 무료 코스에 한해, source='free')
- `grant_subscription`: PENDING → ENROLLED (서버, 활성 구독 확인 시, source='subscription')
- `cancel`: PENDING|ENROLLED → CANCELLED (운영 정책에 따라 제한)

불변식(Invariants)
- 프런트엔드는 ENROLLED로 직접 변경 금지(무료 코스의 `grant_free`는 서버 라우트 통해 수행).
- `provider_tx_id`는 `(provider, provider_tx_id)` 유니크로 멱등 보장.
- 금액 검증은 **서버에서** 수행하며, 프런트 금액은 참조용일 뿐 신뢰하지 않는다.

상태 JSON(참고)
```
{
  "enrollment": {
    "states": ["PENDING","ENROLLED","CANCELLED"],
    "transitions": {
      "pay_succeeded_webhook": {"from": "PENDING", "to": "ENROLLED"},
      "grant_free": {"from": "PENDING", "to": "ENROLLED"},
      "grant_subscription": {"from": "PENDING", "to": "ENROLLED"},
      "cancel": {"from": ["PENDING","ENROLLED"], "to": "CANCELLED"}
    },
    "invariants": ["FE cannot set ENROLLED directly"]
  }
}
```

────────────────────────────────────────────────────
## 3) 결제/가입 흐름(시퀀스)

### A) 코스 가격 타입에 따른 분기
- **free**: [수강하기] 클릭 → 서버 `grant_free` 호출 → ENROLLED → 학습 시작
- **paid (one-time)**: [결제] 클릭 → PG 위젯 → `payments-webhook` → ENROLLED
- **subscription 포함**: 
  - 활성 구독 **있음** → [바로 수강] → 서버 `grant_subscription` → ENROLLED
  - 활성 구독 **없음** → [구독하기] → 구독 결제(플랜) → `subscriptions-webhook` 처리 후 학습 가능

### B) Paid Happy Path
1. Student: 코스 상세에서 [결제] 클릭
2. FE: PG 위젯 호출(파라미터에 `enrollment_id`, `course_id`, `user_id` 포함)
3. PG: 결제 승인
4. PG → **Edge.payments-webhook**: 결제 결과 POST (서명 포함)
5. Edge: 서명 검증 → **금액 검증**(세일/쿠폰/세금/통화) → `payments` upsert → `enrollments.status='ENROLLED'`, `source='purchase'`
6. FE: "결제 처리 중" 배너 → 마이강의실 이동/새로고침
7. Student: ENROLLED 카드 활성화

### C) 쿠폰 검증(사전)
- FE: 결제 전 `Edge.coupons-validate` 호출로 최종 결제 예상금액 표시
- 서버는 실제 결제 시점에 **다시 검증**하여 불일치 시 결제 거절/보류 처리

지연/취소/중복 분기
- 지연: 30초 이내 웹훅 미도착 → FE는 "지연 안내" 배너 + 마이페이지 새로고침 가이드
- 취소: 사용자 위젯 취소 → "결제가 취소되었습니다" 알림 후 원화면 유지
- 중복: 동일 `provider_tx_id` 수신 → Edge는 **no-op 200**, FE는 결제 내역 안내

────────────────────────────────────────────────────
## 4) 금액 산정 규칙(서버)

### 4.1 유효 가격 결정(EPP: Effective Payable Price)
- 입력: `courses(list_price_cents, sale_price_cents, sale_ends_at, tax_included, tax_rate_percent, currency_code)`
- 규칙:
  1) 현재시각 < `sale_ends_at` && `sale_price_cents` 존재 → **세일가** 채택, 아니면 **정가**
  2) 쿠폰 적용: `percent` → `fixed` 순, 최소 0 보장
  3) 세금: `tax_included=true`면 그대로, `false`면 `EPP += round(EPP * tax_rate)`
  4) 통화: 결제 `currency_code`가 코스 통화와 **일치**해야 함(불일치 → 오류)

### 4.2 검증 포인트(웹훅 시)
- `amount_cents == 서버산정 EPP` 여야 함 → 아니면 `E_AMOUNT_MISMATCH`
- `currency_code` 일치 여부 → 아니면 `E_CURRENCY_MISMATCH`
- 쿠폰 사용 시 서버가 쿠폰 상태(기간/횟수/사용자 제한)를 **재검증**
- 세금 금액(`tax_amount_cents`)은 `tax_included`에 따라 기대값과 일치해야 함(선택 검증)

────────────────────────────────────────────────────
## 5) Edge.payments-webhook 계약(갱신)

요청(JSON)
```
{
  "provider": "portone|toss|stripe",
  "provider_tx_id": "string",
  "amount_cents": 123400,
  "currency_code": "KRW",
  "tax_amount_cents": 0,
  "enrollment_id": "uuid",
  "course_id": "uuid",
  "user_id": "uuid",
  "coupon_code": "STRING|null",
  "status": "paid|failed|refunded",
  "raw": { "...": "provider payload" }
}
```

검증 및 처리
- 서명 검증 실패 → 400(`E_WEBHOOK_INVALID_SIG`)
- enrollment/course/user 존재/매칭 확인 실패 → 404(`E_ENROLL_NOT_FOUND`)
- **금액 검증(EPP)** 실패 → 422(`E_AMOUNT_MISMATCH`), 통화 불일치 → 422(`E_CURRENCY_MISMATCH`), 세금 불일치 → 422(`E_TAX_MISMATCH`)
- `payments` **upsert**(`provider`,`provider_tx_id` unique), raw 저장
- `status='paid'` → `enrollments.status='ENROLLED'`, `source='purchase'`
- 쿠폰 포함 시 `coupon_redemptions` 기록(멱등)

응답
- 200 ok (멱등: 이미 처리된 tx도 ok)
- 4xx 에러 코드/메시지

로깅
- 필수: request_id, provider, provider_tx_id, enrollment_id, course_id, user_id, currency_code, amount_cents, status, result

────────────────────────────────────────────────────
## 6) 구독(정액제) 웹훅 계약 요약
- 엔드포인트: `POST /subscriptions/webhook`
- 이벤트: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated|deleted`
- 처리: `user_subscriptions` upsert + `subscription_invoices` upsert(멱등), 상태/기간 반영
- 학습 접근: 코스가 `pricing_mode='subscription'`이고 사용자가 **활성 구독**이면 `grant_subscription`으로 ENROLLED 처리(또는 플레이어 접근시 실시간 체크)

────────────────────────────────────────────────────
## 7) 프런트엔드 UX 가드
- 결제 직후 화면: "결제를 처리하고 있습니다…" 배너 고정.
- 30초 경과 시: "결제 확인이 지연되고 있습니다. 잠시 후 마이페이지에서 상태를 확인해주세요." 안내(지연 배너)
- ENROLLED 토글/버튼은 웹훅 완료 전까지 노출/활성화 금지.
- 실패/취소 시: 원화면 유지 + 명확한 카피(i18n `pay.cancelled`/`pay.error`)
- 구독 코스: 활성 구독 없을 때는 [구독하기]를 우선 노출, 결제 성공 후 자동 리다이렉트

────────────────────────────────────────────────────
## 8) 에러/예외 매핑표(갱신)

코드 | 원인 | 사용자 메시지(i18n) | UI 반응 | 서버 조치/로그
---- | ---- | ------------------- | ------- | ---------------
E_PG_CANCEL | 사용자가 위젯에서 취소 | pay.cancelled | 모달 닫고 원화면 | info 로그
E_PG_TIMEOUT | 위젯 응답 지연 | pay.timeout | 지연 배너 노출 | warn 로그, 웹훅 대기
E_DUP_TX | 중복 결제 감지 | pay.duplicate | 결제 내역 안내 | 200 no-op, audit
E_WEBHOOK_INVALID_SIG | 서명 불일치 | pay.error | 고객센터 안내 | 400, alarm
E_ENROLL_NOT_FOUND | 잘못된 enrollment_id | pay.error | 고객센터 안내 | 404, alarm
E_AMOUNT_MISMATCH | 금액 상이(세일/쿠폰/세금 적용 결과와 불일치) | pay.error | 고객센터 안내 | 422, alarm
E_CURRENCY_MISMATCH | 통화 코드 불일치 | pay.error | 고객센터 안내 | 422, alarm
E_TAX_MISMATCH | 세금 금액 불일치 | pay.error | 고객센터 안내 | 422, alarm
E_COUPON_INVALID | 쿠폰 무효/기간/한도 초과 | coupon.invalid | 메시지 노출 | 422, audit
E_PRICE_STALE | 세일 만료 등 가격 변경 | pay.priceChanged | 최신가 안내 | 409, FE 재시도 유도

────────────────────────────────────────────────────
## 9) 멱등성 & 재시도
- 멱등키: `(provider, provider_tx_id)` unique
- 재시도: PG 재전송 허용. 서버는 중복 시 **no-op 200**
- 프런트 재시도: 새로고침 시 서버 진실을 조회. 클라이언트에서 상태/금액 추정 금지

────────────────────────────────────────────────────
## 10) 보안
- 서버 비밀키/웹훅 시크릿은 Edge 환경변수 보관
- 요청 서명 검증 필수. 실패 시 즉시 400
- PII/결제 민감정보는 최소 저장(필요 필드만 `raw`에 보관)
- 쿠폰 코드 시도는 레이트리밋 적용(IP+user 기준)

────────────────────────────────────────────────────
## 11) 모니터링/알람(갱신)
- 경보 조건:
  - 5분 내 `E_WEBHOOK_INVALID_SIG` ≥ 3
  - 10분 내 `paid` 건 처리지연 > 5건
  - `E_AMOUNT_MISMATCH` 또는 `E_CURRENCY_MISMATCH` ≥ 1
  - 구독 `past_due` 비율이 5% 초과
- 대시보드 항목: 결제 성공률, 평균 웹훅 지연, 멱등 no-op 비율, 쿠폰 실패율, 통화 불일치 비율

────────────────────────────────────────────────────
## 12) 테스트 수용 기준(AC)
- AC1: 결제 성공 후 웹훅 도착 시 ENROLLED로 전이되고, 프런트는 서버 상태를 조회한다.
- AC2: 웹훅 미도착(30s) 시 지연 배너가 표시된다.
- AC3: 프런트는 ENROLLED를 직접 설정하지 않는다.
- AC4: 중복 `provider_tx_id`가 와도 서버는 200 no-op, 상태는 정확히 한 번만 ENROLLED가 된다.
- AC5: **세일/쿠폰/세금/통화**를 포함한 금액 검증에 불합격하면 4xx(또는 409)로 처리된다.
- AC6: 구독 코스에서 활성 구독이 있으면 `grant_subscription`으로 ENROLLED가 된다.
- AC7: 무료 코스는 서버 `grant_free` 호출로 ENROLLED가 된다.
- AC8: 쿠폰 적용 전/후 금액이 UI에 정확히 반영된다(서버 재검증 포함).

────────────────────────────────────────────────────
## 13) 시드/데모 값(권장)
- 테스트 enrollment_id 3개(PENDING 상태)
- provider_tx_id 샘플: TX-OK-1, TX-DUP-1, TX-BADSIG-1
- 금액 검증용 코스: 
  - paid: 정가 10000, 세일 9000(오늘 23:59 만료), 쿠폰 10% / 1000원 고정 샘플
  - subscription: plan BASIC_MONTHLY(9900 KRW)
  - free: 0원 코스
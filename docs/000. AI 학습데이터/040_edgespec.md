# 040_edgespec — Edge Functions 명세 (v3.5)

## 공통

- 인증: 서버 간 호출은 Webhook Secret 또는 HMAC 서명 검증(예: `X-Signature` 헤더, sha256 HMAC).
- 권한: 함수는 **service_role** 키로 DB 접근. **사용자 토큰은 신뢰하지 않음**.
- 멱등: 외부 이벤트는 고유 식별자(예: `provider_tx_id`, `event_id`) 기준 멱등 처리.
- 로깅: 모든 함수는 `request_id`, `function`, `actor`, `course_id`, `enrollment_id`, `attempt_id`, `provider`, `provider_tx_id`, `status` 로그.
- 커리큘럼 모델: `course_sections` 제거됨 → `lessons.is_section=true` 행을 섹션 헤더로 처리(섹션 행은 미리보기/진도 계산 제외).
- 에러 응답 규격: `{ code: string, message: string }` + 4xx/5xx.

---

## 1) POST /coupons/validate

- Summary: 결제 전에 쿠폰 코드 검증/적용 금액 계산(읽기 전용)
- Auth: Backend-to-backend(HMAC) 또는 사용자 세션 + 서버 재검증
- Request(JSON):
    ```json
    {
        "user_id": "uuid",
        "course_id": "uuid",
        "coupon_code": "STRING"
    }
    ```
- Steps:
    1. `courses` 조회: 가격 결정(세일 유효 시 세일가)
    2. `coupons`에서 `code` 유효성(활성/기간/잔여횟수/사용자 제한) 검사
    3. 할인 적용 규칙: percent → fixed 순서, 최소 0 보장
    4. 세금 포함/별도(`tax_included`, `tax_rate_percent`) 계산
    5. 최종 금액/할인액/세금액을 반환(실제 `coupon_redemptions`는 결제 확정 시 기록)
- Response(JSON):
    ```json
    {
        "valid": true,
        "list_price_cents": 12000,
        "sale_price_cents": 9900,
        "discount_cents": 1000,
        "final_price_cents": 8900,
        "currency_code": "KRW",
        "tax_amount_cents": 0,
        "message": "ok"
    }
    ```
- Errors: 404 course/coupon not found, 422 invalid coupon window/limit

---

## 2) POST /exams/grade

- Summary: 시험 응시 채점 및 합격 판정
- Request(JSON): `{ "attempt_id": "uuid" }`
- Steps:
    1. attempt 존재/소유 확인(해당 enrollment/user 매칭) → 실패 404/403
    2. 기 채점 건 멱등 처리 → 기존 결과 반환
    3. `exam_questions` + 제출 답안 채점(`single|multiple|short`), `pass_score` 적용
    4. `exam_attempts` 업데이트(score, passed, submitted_at)
    5. passed=true → `POST /certificates/issue` 비동기 트리거(멱등)
- Responses: 200 `{ attempt_id, score, passed }` | 404 | 403 | 422

---

## 3) POST /certificates/issue

- Summary: 합격 시 수료증 PDF 생성/저장/메일 발송
- Request(JSON): `{ "enrollment_id": "uuid", "attempt_id": "uuid" }`
- Preconditions: `attempt.passed = true`
- Steps:
    1. enrollment/attempt/course/user 검증(소유/합격)
    2. `serial_no` 생성(YYYYMMDD-####)
    3. PDF 렌더링 → Storage 업로드(`/certs/{YYYY}/{serial_no}.pdf` 비공개)
    4. `certificates` upsert(enrollment_id unique), 서명 URL(≤2h) 발급
    5. 이메일 발송 실패 시 202 수락 + 재시도 큐
- Responses: 200 `{ certificate_id, pdf_path, serial_no }` | 404 | 409 | 422

---

## 4) POST /qna/notify

- Summary: Q&A 생성/답변 시 알림 발송(강사/질문자)
- Auth: service_role + 내부 이벤트 트리거
- Request(JSON):
    ```json
    {
        "type": "question.created|answer.created",
        "course_id": "uuid",
        "question_id": "uuid",
        "answer_id": "uuid|null",
        "actor_user_id": "uuid"
    }
    ```
- Steps:
    1. 코스/질문/답변 조회 및 권한 확인(RLS 우회)
    2. 대상자 결정: `question.created`→코스 강사, `answer.created`→질문자
    3. 메일/푸시 발송(실패 시 로그 + 재시도 큐)
- Responses: 202 accepted | 422 invalid payload

---

## 5) 유틸/보안 공통

- **서명 검증 예시**: `base64(hmac_sha256(secret, rawBody))` → `X-Signature` 와 비교
- **멱등 처리**: `payments.provider_tx_id`, `event_id`에 **unique** 제약
- **시간 동기화**: 모든 시간은 UTC 저장, 프런트에서 타임존 변환
- **레이트 리밋**: IP+provider 조합으로 1분당 N회 제한(429)

---

## 관측/모니터링(전 함수 공통)

- 필수 로그 필드: `request_id`, `function_name`, `user_id`, `course_id`, `enrollment_id`, `attempt_id`, `provider`, `provider_tx_id`, `status`
- 알람 룰:
    - 5분 내 `E_WEBHOOK_INVALID_SIG` 3건 이상 → 경보
    - `E_STORAGE_FAIL`/`E_MAIL_FAIL` 누적 5건 이상 → 경보

# 071_payment_errors — 결제/웹훅 에러 매핑표

본 문서는 결제 및 웹훅 처리 과정에서 발생할 수 있는 에러 코드, 사용자 메시지(i18n 키), UI 반응, 서버 로깅/알람 정책을 정의한다.

────────────────────────────────────────────────────
## 에러 매핑표

코드 | 원인 | 사용자 메시지(i18n) | UI 반응 | 서버 조치/로그
---- | ---- | ------------------- | ------- | ---------------
E_PG_CANCEL | 사용자가 결제 위젯에서 취소 | pay.cancelled | 모달 닫고 원화면 유지 | info 로그
E_PG_TIMEOUT | 결제 위젯 응답 지연 | pay.timeout | "결제 확인 지연" 배너 | warn 로그, 웹훅 대기
E_DUP_TX | 동일 provider_tx_id 중복 | pay.duplicate | 결제 내역 안내 화면 | 200 no-op, audit 기록
E_WEBHOOK_INVALID_SIG | 서명 검증 실패 | pay.error | "결제 오류" 안내, 고객센터 문의 | 400, alarm 발송
E_ENROLL_NOT_FOUND | enrollment_id 불일치 | pay.error | "결제 오류" 안내, 고객센터 문의 | 404, alarm 발송
E_AMOUNT_MISMATCH | 결제 금액 상이 | pay.error | "결제 오류" 안내, 고객센터 문의 | 422, alarm 발송
E_CURRENCY_MISMATCH | 통화 코드 불일치 | pay.error | "결제 오류" 안내, 고객센터 문의 | 422, alarm 발송
E_TAX_MISMATCH | 세금 금액 불일치 | pay.error | "결제 오류" 안내, 고객센터 문의 | 422, alarm 발송
E_COUPON_INVALID | 쿠폰 무효/기간/한도 초과 | coupon.invalid | "쿠폰이 유효하지 않습니다" 토스트 | 422, audit 로그
E_COUPON_EXPIRED | 쿠폰 만료 | coupon.expired | "쿠폰이 만료되었습니다" 토스트 | 422, audit 로그
E_PRICE_STALE | 세일/가격 만료 등 최신가 불일치 | pay.priceChanged | "가격이 변경되었습니다. 다시 시도해주세요" 안내 | 409, audit 로그
E_PROVIDER_DOWN | PG 서버 응답 불가 | pay.error | "결제 시스템 점검 중" 안내 | 503, error 로그, 알람
E_NETWORK | 네트워크 장애 | errors.network | "네트워크 오류" 토스트 + 재시도 버튼 | error 로그

────────────────────────────────────────────────────
## 처리 원칙

- 모든 에러는 정의된 코드와 i18n 키로 매핑한다.
- 프론트는 에러 코드를 받아 사용자 메시지를 i18n에서 렌더링한다.
- 서버는 에러 발생 시 audit 로그와 필요시 알람을 발송한다.
- 멱등성 보장: E_DUP_TX의 경우 서버는 항상 200 no-op을 반환한다.
- 치명적 에러(E_WEBHOOK_INVALID_SIG, E_AMOUNT_MISMATCH)는 운영자 알람 발송.
- 쿠폰 관련 오류(E_COUPON_INVALID, E_COUPON_EXPIRED)는 audit 로그만 남기며 사용자에게 즉시 메시지를 노출한다.
- 가격 변경(E_PRICE_STALE)은 409 반환 및 최신 가격 안내.

────────────────────────────────────────────────────
## 수용 기준 (AC)

- AC1: 결제 취소 시 사용자에게 명확한 메시지가 표시된다.
- AC2: 웹훅 서명 검증 실패는 400과 함께 alarm이 발송된다.
- AC3: 금액 상이 시 422 에러와 함께 고객센터 안내가 표시된다.
- AC4: 중복 결제는 no-op 처리되며 audit 로그가 남는다.
- AC5: 네트워크 오류 시 재시도 버튼이 표시된다.
- AC6: 쿠폰 무효/만료 시 UI에 적절한 메시지가 표시된다.
- AC7: 세일 종료 등 가격 변경 시 최신 가격으로 안내된다.
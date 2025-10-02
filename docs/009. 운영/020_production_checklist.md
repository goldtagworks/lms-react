# 프로덕션 운영 체크리스트

> 목적: 결제 Edge Function(`confirm-payment`) 및 LMS 핵심 흐름을 프로덕션에 안전하게 배포하기 위한 종합 점검 목록.

---

## 1. 스키마 & 제약 조건

| 항목                                                        | 필요 여부           | 상태 |
| ----------------------------------------------------------- | ------------------- | ---- |
| payments.provider + payments.provider_tx_id UNIQUE          | 필수                |      |
| enrollments.user_id + enrollments.course_id UNIQUE          | 필수                |      |
| payments.enrollment_id FK(enrollments.id) ON UPDATE CASCADE | 권장                |      |
| exam_attempts(enrollment_id) FK                             | 존재 시 무결성 확인 |      |

> 누락 시 마이그레이션 추가 후 재배포. 중복 결제/중복 수강 방지 핵심.

---

## 2. 시크릿 & 환경 변수

| 이름                      | 위치            | 설명                | 검증 |
| ------------------------- | --------------- | ------------------- | ---- |
| TOSS_SECRET_KEY           | Supabase Secret | Toss Server Key     |      |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Secret | DB server-side 권한 |      |
| WEBHOOK_SECRET            | Supabase Secret | HMAC 서명 키        |      |
| VITE_TOSS_CLIENT_KEY      | FE .env         | Toss client key     |      |
| VITE_SUPABASE_URL         | FE .env         | 프로젝트 URL        |      |
| VITE_SUPABASE_ANON_KEY    | FE .env         | anon key            |      |

회전 정책: WEBHOOK_SECRET 분기 1회, SERVICE_ROLE 연 1회 (사고 시 즉시 회전).

---

## 3. HMAC & 멱등 구현 상태

| 항목                 | 목표                    | 현 구현     | 개선 우선순위 |
| -------------------- | ----------------------- | ----------- | ------------- |
| HMAC 서명 알고리즘   | HMAC-SHA256             | mock stub   | 상            |
| timestamp 허용 편차  | 300s                    | stub        | 상            |
| 서명 재사용 차단     | 10분 window             | 미구현      | 상            |
| idempotency 저장소   | Redis/KV/Table          | 메모리/스텁 | 상            |
| paymentKey 기반 캐시 | 성공 confirm 재호출 200 | 일부        | 중            |

---

## 4. 로그 & 모니터링

필드 표준: request_id,function_name,provider,provider_tx_id,enrollment_id,course_id,user_id,status,error_code,latency_ms

| 항목             | 구현                             | 노트 |
| ---------------- | -------------------------------- | ---- |
| 구조화 JSON 로그 | console.log(JSON.stringify())    |      |
| request_id 전파  | 프런트 → Edge 헤더(X-Request-Id) |      |
| Latency 측정     | 처리 전후 Date.now()             |      |
| 대시보드         | (선택: Logflare/Grafana)         |      |

알람 기준(초기):

- E_AMOUNT_MISMATCH >= 1/1000 거래
- 승인 실패율 > 2% (5분 이동 창)
- p95 latency > 1500ms (15분 지속)

---

## 5. 성능

| 항목                 | 목표       | 측정 | 액션 조건                               |
| -------------------- | ---------- | ---- | --------------------------------------- |
| p95 Edge confirm     | < 1500ms   |      | 초과 시: 네트워크 vs Toss API 분리 측정 |
| 평균 DB round trips  | <= 3       |      | 초과 시: upsert + select 묶기           |
| JS 번들 사이즈 (app) | < 250KB gz |      | 초과 시: dynamic import 분리            |

---

## 6. 실패/회복 전략

| 시나리오         | 감지                       | 즉시 대응                 | 후속 조치                |
| ---------------- | -------------------------- | ------------------------- | ------------------------ |
| Toss API 장애    | 연속 5회 5xx               | 사용자 안내 + 재시도 버튼 | 장애 공지 / PG 지원 문의 |
| DB deadlock/lock | latency 급증               | 지연 로그 채집            | 쿼리 인덱스 점검         |
| 금액 불일치 다발 | E_AMOUNT_MISMATCH 증가     | 일시 결제 중단 toggling   | 가격 계산 로직 diff 분석 |
| 서명 위조 시도   | E_WEBHOOK_INVALID_SIG 증가 | IP 레이트리밋             | 서명 키 회전             |

---

## 7. 배포 롤백 플랜

| 조건              | 롤백 조치                   | 데이터 영향    |
| ----------------- | --------------------------- | -------------- |
| 승인 실패율 급증  | 이전 함수 버전 재배포       | 없음           |
| 금액 불일치 폭증  | confirm 함수 disable (임시) | 신규 결제 불가 |
| 성능 열화(p95>3s) | CDN/Edge 지역 재평가        | 없음           |

Supabase Edge: `functions deploy <name> --import-map <prev_version>` 형태(IaC 스크립트 권장)로 특정 커밋 기반 재배포.

---

## 8. 프런트엔드 연동 점검

| 항목                         | 기대 동작                              | 상태 |
| ---------------------------- | -------------------------------------- | ---- |
| 결제 성공 후 쿼리 invalidate | ['enrollment',id], ['course',courseId] |      |
| 로컬 payment flow state 정리 | success/fail 페이지에서 clear          |      |
| 에러 코드 i18n 매핑          | ui.payment.error.\* 존재               |      |
| CORS                         | Edge 함수 허용                         |      |

---

## 9. QA 시나리오 (최소)

| 케이스        | 절차                                   | 기대                                   |
| ------------- | -------------------------------------- | -------------------------------------- |
| 정상 결제     | 코스 A 10,000원 → Toss 테스트카드 승인 | enrollment ENROLLED, payment 저장      |
| 금액 변조     | FE devtools amount 변경 후 confirm     | 400 + E_AMOUNT_MISMATCH                |
| 중복 confirm  | 성공 후 동일 payload 재POST            | 200 + 동일 enrollment_id 반환 (no dup) |
| 네트워크 중단 | 승인 직후 탭 강제종료 → 재진입         | 강제 refresh 시 enrollment 존재        |
| 잘못된 서명   | X-Signature 변조                       | 401 E_WEBHOOK_INVALID_SIG              |

---

## 10. 변경 승인 조건

- 위 QA 5 케이스 PASS 스크린샷/로그 첨부
- 체크박스 1~9 섹션 모두 채움
- reviewer 2인 승인 (보안/비즈 담당)

---

## 11. 향후(문서만) 고려 항목

- KMS/HSM 기반 서명 키 관리
- Observability: Traceparent 헤더 도입
- Rate limiting: IP + userId 조합 (초당 n회)
- Refund workflow (Edge 함수 + PG cancel API) SLA 정의

---

## 최종 승인 서명

| 역할      | 이름 | 일시 |
| --------- | ---- | ---- |
| 개발 책임 |      |      |
| 보안 담당 |      |      |
| 비즈 PM   |      |      |

문서 업데이트 시 PR 필수. 준수 미달 시 배포 중단.

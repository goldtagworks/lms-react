---
version: 1.2
stage: full-stack-quality
source_steps: [1,2,3,4,5,6,7,8,9]
audience: dev+ai
updated: 2025-09-26
supersedes: INSTRUCTION_v1.1.md
scope: "Quality Gates + OpenAPI + Gherkin + Idempotency + Observability"
next_release_target: v1.3
---
# Instruction v1.2 (Quality & Contract Integration)
> v1.1에 품질 게이트(Accessibility/Performance/Security/Test), OpenAPI 스켈레톤, Gherkin 플로우, Idempotency 통합 전략, Observability 지표 체계를 추가.

## 1. Quality Gates 개요
| Gate | Metric/검증 | 기준 |
|------|-------------|------|
| A11y | axe serious/critical | 0 |
| i18n | missing/duplicate keys | 0 |
| Coverage | statements % | ≥70% (점진 80%) |
| Payment Success | success/total | ≥98% |
| Webhook Invalid Sig | 5분 내 건수 | <3 |
| Exam Focus AutoSubmit | focus 이유 비율 | <10% |
| Edge p95 Latency | ms | <1500 |
| Certificate Storage Fail | 5분 | 0 |

## 2. OpenAPI 계약 (요약)
파일: `docs/openapi/edges.openapi.json` (v1.2). Paths:
- POST /payments/webhook
- POST /subscriptions/webhook
- POST /coupons/validate
- POST /exams/grade
- POST /certificates/issue
- POST /qna/notify
Components:
- Error { code, message }
- Price { basePrice, finalPrice, discount, taxAmount }
- Enrollment { id, user_id, course_id, status }
- ExamAttempt { id, exam_id, user_id, score, passed, status }
- Certificate { id, serial_no, pdf_url }

## 3. Gherkin 핵심 시나리오 (초안)
1) payment_webhook.feature: 결제 → ENROLLED, 금액 불일치 에러
2) subscription_webhook.feature: 구독 갱신/만료 경계
3) coupon_validate.feature: 유효/만료/중복/통화 불일치
4) exam_certificate.feature: 합격/불합격/자동제출/수료증 멱등
(추가 후보) learning_progress.feature, refund_policy.feature

## 4. Idempotency 통합 전략
테이블: `idempotency_keys`
| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | pk |
| scope | text | 도메인(webhook_payment, exam_grade 등) |
| key_hash | text unique | 해시(provider+tx or attempt_id) |
| first_result | jsonb | 최초 응답 페이로드 스냅샷 |
| created_at | timestamptz | 삽입 시간 |
| expires_at | timestamptz | 기본 +30d |
프로시저: `claim_idempotency(scope, raw_key, payload_json)` → 이미 존재 시 first_result 반환.

웹훅/채점/수료증 발급 호출 flow:
1) 해시 생성 → claim
2) 존재: 저장 응답 재전송(200)
3) 신규: 비즈니스 처리 → 결과 저장 → 반환

## 5. Observability 확장
메트릭 명세:
```
counter lms_payment_success_total{provider}
counter lms_payment_invalid_sig_total
histogram lms_edge_latency_ms{fn}
counter lms_exam_auto_submit_total{reason}
counter lms_certificate_issue_fail_total{type}
gauge lms_subscription_past_due_ratio
counter lms_i18n_missing_key_total
```
로그 샘플 규약: 필드 snake_case, timestamp ISO8601, error_code null 허용.

## 6. i18n 커버리지 스크립트 설계
CLI: `node scripts/i18n-lint.mjs`
출력 JSON:
```
{
  "missing": ["exam.timerPause"],
  "unused": ["legacy.key1"],
  "duplicate": [],
  "stats": { "used":120, "defined":121, "coverage":0.99 }
}
```
CI 실패 조건: missing.length>0 OR duplicate.length>0.

알고리즘:
1) 소스 스캔: regex `t\(['"`]([A-Za-z0-9_.-]+)['"`]` 수집
2) 카탈로그 키 집합 비교
3) 사용 빈도 카운트 → 미사용/중복 식별

## 7. A11y 테스트 파이프라인
- 도구: axe-core + Playwright (headless chromium)
- 핵심 플로우 페이지 5개 스냅샷 검사
- serious/critical 발견 시 CI fail

## 8. Performance 가드
- Lighthouse CI (선택) budget: LCP < 3.2s, TTI < 4s, CLS < 0.1
- React Query: 과도한 refetch 감지(로그 기준 5분 내 동일 key 5회 초과 시 경고)

## 9. Security 고도화 (웹훅)
Header: `X-Signature` + `X-Timestamp`
검증: abs(now - ts) ≤ 300s → HMAC(secret, ts + body)
Secret rotation: active + next 2개 키 허용.
Replay 방지: (ts,signature) 최근 10분 내 재사용 시 거절.

## 10. 문서/테스트 TODO (v1.2 범위 내)
| 항목 | 타입 | 상태 |
|------|------|------|
| edges.openapi.json | 문서 | 스켈레톤 생성 | 
| 4 Gherkin feature | 테스트 | 스켈레톤 | 
| i18n-lint.mjs | 스크립트 | 설계(미구현) |
| idempotency_keys ddl | DB | 설계만 |
| metrics 명세 | 문서 | 본 문서 포함 |

## 11. Definition of Done (v1.2)
| 항목 | 기준 |
|------|------|
| OpenAPI | 모든 6개 경로 스켈레톤 존재 |
| Gherkin | 4개 feature 파일 초안 커밋 |
| Idempotency | 테이블 설계 & claim 프로시저 의사코드 문서화 |
| i18n | lint 스크립트 문서화 + 규칙 확정 |
| Quality Gates | 측정 항목 표/기준 확정 |

## 12. 다음(v1.3) 예정
| 영역 | 계획 |
|------|------|
| Refund Policy | 073 문서 반영 + Gherkin |
| Webhook 보안 문서 | 093 상세 & 키 로테이션 예제 |
| Search 성능 | FTS/뷰 전략 구현 |
| DR/Backup | 095 문서 + 복구 리허설 체크리스트 |
| Admin Screens | 06b 설계 & 권한 테스트 |

---
Instruction v1.2 끝. 이후 v1.3에서 환불/보안/백업/검색 확장 예정.

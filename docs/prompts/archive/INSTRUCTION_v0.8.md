---
version: 0.8
stage: foundations+edge
source_steps: [1,2,3]
updated: 2025-09-26
audience: dev+ai
supersedes: INSTRUCTION_v0.md
scope: "Foundations + Edge Functions 결제/구독/쿠폰/시험/수료증 인터페이스" 
next_release_target: v1.0
---
# Instruction v0.8 (Foundations + Edge Interfaces)
> v0 대비 추가: Edge Functions 6종 상세, 에러 코드/멱등/로그 표준, 결제/구독/채점/수료 흐름 초안.

> 📌 최신 버전(v0.9, UI/라우트/A11y/테스트 AC 확장 포함)은 `INSTRUCTION_v0.9.md` 를 참고하세요.

## 1. 목적
- FE/Edge/DB가 **결제→수강활성→학습→시험→수료** 파이프라인을 통과하는 최소 통합을 구현할 수 있게 표준 인터페이스 제공.
- v1.0 이전: 품질 게이트(접근성, i18n coverage, OpenAPI 자동화) 아직 Placeholder.

## 2. 시스템 핵심 플로우(요약 시퀀스)
1) (선택) 쿠폰 검증 → 결제 진행
2) 결제 PG Webhook → /payments/webhook → ENROLLED
3) 학습 진도 → progress view 60% 이상 → 시험 버튼 활성
4) 시험 제출 → /exams/grade → 합격 시 /certificates/issue 비동기
5) 수료증 발급 완료 → 사용자 PDF 다운로드/메일
6) 구독 결제(정액) 이벤트 → /subscriptions/webhook → user_subscriptions 반영

## 3. Edge Functions 인터페이스 표
| # | Endpoint | Method | 목적 | 멱등 Key | 주요 성공 출력 | 주요 오류 코드 |
|---|----------|--------|------|----------|---------------|----------------|
| 1 | /payments/webhook | POST | 단건 결제 결과 반영 | provider+provider_tx_id | `{status:'paid'}` | E_WEBHOOK_INVALID_SIG,E_ENROLL_NOT_FOUND,E_DUP_TX |
| 2 | /subscriptions/webhook | POST | 구독 이벤트 동기화 | event_id | `{status:'ok'}` | E_WEBHOOK_INVALID_SIG,E_PLAN_NOT_FOUND |
| 3 | /coupons/validate | POST | 쿠폰 유효성/금액 계산 | (stateless) | 가격 계산 결과 | E_COURSE_NOT_FOUND,E_COUPON_INVALID |
| 4 | /exams/grade | POST | 시험 채점 | attempt_id | 점수/합격여부 | E_ATTEMPT_NOT_FOUND,E_FORBIDDEN,E_ALREADY_GRADED |
| 5 | /certificates/issue | POST | 수료증 발급 | enrollment_id | certificate 메타 | E_CERT_ALREADY_ISSUED,E_NOT_PASSED |
| 6 | /qna/notify | POST | Q&A 알림 | event (type+id) | `{accepted:true}` | E_INVALID_QNA_CTX |

## 4. 에러 코드 카탈로그 (확장)
| 코드 | 의미 | HTTP | 비고 |
|------|------|------|------|
| E_WEBHOOK_INVALID_SIG | 서명 검증 실패 | 400 | HMAC mismatch |
| E_INVALID_PAYLOAD | 필드/타입 오류 | 422 | Validation fail |
| E_ENROLL_NOT_FOUND | enrollment_id 없음 | 404 | |
| E_DUP_TX | 중복 결제/인보이스 | 409 | unique 충돌 |
| E_PLAN_NOT_FOUND | plan_code 매칭 실패 | 422 | |
| E_COUPON_INVALID | 쿠폰 만료/비활성/제한 초과 | 422 | |
| E_COURSE_NOT_FOUND | course_id 없음 | 404 | |
| E_ATTEMPT_NOT_FOUND | attempt_id 없음 | 404 | |
| E_FORBIDDEN | 소유/권한 위반 | 403 | RLS 우회 확인 실패 |
| E_ALREADY_GRADED | 기 채점 완료 | 409 | 멱등 처리 |
| E_NOT_PASSED | 합격 조건 미충족 | 422 | 수료증 발급 거부 |
| E_CERT_ALREADY_ISSUED | 중복 발급 시도 | 409 | unique(enrollment_id) |
| E_INVALID_QNA_CTX | Q&A 컨텍스트 불일치 | 422 | |
| E_STORAGE_FAIL | 스토리지 업로드 실패 | 500 | 재시도 큐 |
| E_MAIL_FAIL | 메일 발송 실패 | 202 | 재시도 큐(soft fail) |
| E_RATE_LIMIT | 레이트 제한 초과 | 429 | IP/provider 기준 |
| E_IDEMPOTENT_REPLAY | 멱등 재요청(no-op) | 200 | 메타 flag 포함 |

## 5. 멱등 처리 전략
| 리소스 | Unique Key | 동작 |
|--------|------------|------|
| payments | (provider,provider_tx_id) | UPSERT → 기존 row 반환, duplicate 로그 |
| subscription_invoices | (provider,provider_tx_id) | UPSERT |
| subscriptions webhook | event_id | 처리 여부 테이블(or 로그) 기록 |
| exam grade | attempt_id + submitted_at 존재 | 이미 채점 시 바로 반환 |
| certificates | enrollment_id | 기존 certificate 반환 |

추가 제안: `idempotency_keys` 테이블(키, created_at, meta) 도입; TTL=24h.

## 6. 로깅 & 관측 (필수 필드)
```
{
  request_id, function_name, user_id?, course_id?, enrollment_id?, attempt_id?,
  provider?, provider_tx_id?, status: 'success|error', error_code?, latency_ms
}
```
- 경보 룰: 5분 내 E_WEBHOOK_INVALID_SIG ≥3, E_STORAGE_FAIL ≥5, past_due 비율 >5%.

## 7. 결제 & 쿠폰 계산 개요 (v0.8 수준)
- 가격 결정 순서: list_price → (sale 유효 시 sale_price) → 쿠폰(percent → fixed 순) → 하한 0 → 세금(tax_included=false면 gross = net + tax)
- 정규화 함수 제안: `computeEffectivePrice({list,saleEnds,salePrice,now,coupon?,tax})` → { basePrice, discountCoupon, finalPrice, taxAmount }

## 8. 시험 채점 로직 초안
```
for each question:
  switch(type):
    single: correct = (submitted == answer)
    multiple: correct = (set(submitted) == set(answer))
    short: normalize(trim(lower(submitted))) == normalize(answer)
score = correctCount / total * 100
passed = score >= pass_score
```
- 단축 멱등: attempt.score 존재하면 재채점 금지(E_ALREADY_GRADED)
- 제출 시점: grade 호출이 최초 제출 역할( submitted_at = now )

## 9. 수료증 발급 로직 초안
조건: enrollment.status='ENROLLED' & attempt.passed=true & certificate 미존재
1) serial_no = YYYYMMDD + 4자리 증가 시퀀스(경합 시 nextval() 시퀀스 추천)
2) PDF 템플릿 엔진(후속 선택: jsPDF, 서버 HTML->PDF)
3) Storage 업로드 후 signed URL(2h TTL) 생성
4) 메일 큐 등록 → 실패 시 E_MAIL_FAIL 로그 + 202 반환

## 10. Q&A 알림 플로우
- question.created → instructor 목록(1명) 대상 메일
- answer.created → 원 질문 user 대상으로 메일
- 재시도 큐: 실패 로그 → 5m/15m/1h backoff (정책 미정, v1에서 확정)

## 11. FE ↔ Edge 호출 어댑터 패턴
| Layer | 책임 | 규칙 |
|-------|------|------|
| fetcher | fetch + 서명 헤더/HMAC 적용 | 함수당 1파일 혹은 index export |
| adapter | 도메인별 요청/응답 타입 보정 | Zod schema parse 후 결과 반환 |
| hook | 캐시/재시도/에러 매핑 | `useMutation`, `useQuery` 래핑 |

## 12. TODO (v1.0 승격 전 필수)
| 영역 | 작업 |
|------|------|
| OpenAPI | 위 6개 함수 경로/스키마 정의 → `openapi/edges.openapi.json` 생성 |
| Price Engine | EPP + 세금 계산 함수 prod 안전성 테스트 |
| Rate Limit | Edge KV/Redis(or table) 기반 IP/provider throttle |
| Idempotency | idempotency_keys 테이블 + 정리 job |
| Error Mapping | FE 전역 toasts/snackbar 매핑 테이블 |
| Certificate PDF | 템플릿 확정 + 다국어 레이아웃 |
| Exam Anti-Cheat | 포커스 이탈 카운트 정책 문서화 |
| Coupon Edge Cases | 만료 직전/동시 redeem race integration test |

## 13. Definition of Done (v0.8)
| 항목 | 기준 |
|------|------|
| Webhook 처리 | 결제/구독 JSON mock 호출 후 ENROLLED/구독 row 반영 |
| 채점/수료 | mock exam → grade → issue certificate row 생성 |
| 쿠폰 검증 | 잘못된 코드 422, 유효 코드 final_price 계산 |
| 멱등 | 동일 provider_tx_id 재요청 → duplicate 로그 + 200 |
| 로깅 | 모든 함수 request_id 포함 콘솔(or log sink) 출력 |

## 14. 리스크 업데이트
| 리스크 | 추가 설명 | 완화 |
|--------|----------|------|
| 채점 멱등 누락 | 재채점 score 오염 | score not null guard |
| 수료증 중복 발급 | race attempt↔issue | unique(enrollment_id) + 트랜잭션 |
| 구독 이벤트 순서 역전 | provider 지연/재전송 | event_id + billed_at 비교 로직 |
| 쿠폰 over-redemption | 동시성 | row-level lock or select for update |
| Webhook 시그니처 우회 | 미검증 fallback | 강제 400 + 경보 트리거 |

## 15. 마이그레이션 노트 (v0 → v0.8)
- 새 Edge 함수 표 추가, 에러 코드 7→17 확장
- 멱등/로깅 표준 섹션 추가
- v0 Sprint 백로그는 그대로 유지, 단 P1 완료 후 Edge 통합 테스트 단계 추가 권고

---
Instruction v0.8 문서 끝. 다음 단계: Step4~6 문서 학습 → UI/Design/Payment 디테일 통합 → v1.0.

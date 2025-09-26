---
purpose: 'AI & dev 실행용 최소 규칙 (LMS v1.0)'
scope: '사실 기반; 미래 계획 금지; 변경 시 PR에 근거 문서 링크 필수'
updated: 2025-09-26
---

# Copilot Instructions (LMS)

1. 구현 순서(초기): Data(마이그레이션/타입) → Edge 공통(HMAC, 멱등 스텁) → Core Types/Query Keys → Router & Guards → Feature Hooks → UI Components → 테스트(결제/쿠폰/시험/수료증/환불 조건).
2. React Query Key 패턴 고정: ['course',id], ['lessons',courseId], ['enrollment',id], ['progress',enrollmentId], ['exam',id], ['reviews',{courseId,page}], ['qna',{courseId,page}], ['wishlist','me'], ['coupons',filters,page], ['categories'], ['metrics',courseId]. 새 키는 이 규칙 재사용.
3. 금지: 클라이언트가 ENROLLED 직접 설정/변경 불가. 결제 금액 신뢰 금지(서버 EPP 재계산 우선).
4. Edge 함수 에러 응답 형식 통일: { code: string, message: string } + 적절한 4xx/5xx. code는 상수화.
5. 결제 EPP 계산 요약: 세일 유효 → 세일가; 쿠폰 percent → fixed 순 적용 후 최소 0; tax_included=false면 세금 가산; 통화 불일치 즉시 오류.
6. 멱등: (provider,provider_tx_id) unique 또는 도메인별 idempotency_keys(도입 전이면 in-memory/stub). 중복 처리: 기존 결과 200 재반환 + no-op 로그.
7. 핵심 테이블 관점: courses(pricing_mode,list/sale/tax), enrollments(status=PENDING|ENROLLED|CANCELLED, source), payments(unique provider+tx), exams(pass_score), exam_attempts(score/passed), certificates(unique enrollment), coupons/limits.
8. RLS 요약: 코스/섹션/레슨 쓰기 = 소유 강사 or admin. 수강·결제·시도·수료증 읽기 = 본인. 쿠폰/카테고리 관리 = admin. Preview lesson 은 공개+is_preview=true 조건.
9. i18n: 새 UI 문자열은 '051_copy_catalog.json'에 ko/en 모두 추가 후 사용. 미사용/누락 키는 i18n lint 스크립트(추가 필요) 대상.
10. 디자인 토큰: '050_design_tokens.json' → Mantine theme 변환 레이어 (예: src/lib/theme.ts) 추가. 색상/spacing/token 직접 하드코딩 금지.
11. 필수 초기 파일(미존재 시 생성 제안): src/lib/supabase.ts, src/lib/queryClient.ts, src/lib/i18n.ts, src/app/router.tsx, src/edge/utils/signature.ts, src/edge/utils/idempotency.ts(stub), src/features/payments/epp.ts.
12. Edge 공통 유틸: verifySignature(rawBody, headers) → boolean; ensureIdempotent(scope, key) → {cached?:true}; logEvent(meta).
13. 로그 필드 표준: request_id,function_name,provider,provider_tx_id,enrollment_id,course_id,user_id,attempt_id,status,error_code,latency_ms.
14. 주요 에러 코드: E_WEBHOOK_INVALID_SIG, E_AMOUNT_MISMATCH, E_CURRENCY_MISMATCH, E_TAX_MISMATCH, E_DUP_TX, E_ENROLL_NOT_FOUND.
15. 테스트 우선(Happy+Edge): payments webhook 금액 검증, coupon validate 만료/한도/통화, exam grade 멱등, certificate issue 멱등, 환불(미수강 취소) 로직.
16. 접근성 Gate: axe serious/critical = 0 (새 페이지 PR 전 로컬 검사).
17. 성능 가드(초기): React Query 특정 key 5분 내 과도 refetch(>5) 시 로그 경고; Edge 함수 p95 latency 목표 <1500ms.
18. 시큐리티: 모든 Edge 호출 X-Signature(+선택 X-Timestamp). abs(now - ts) ≤ 300s 검증 + 재사용 서명 10분 내 차단(간단 캐시 가능).
19. 클라이언트 금지 패턴: 임의 price_cents 계산, enrollment 직접 UPDATE, 시험 pass 로직 복제, 수료증 PDF 경로 추측.
20. 변경 원칙: 미래 계획/추측 추가 금지. 실제 구현/스키마/문서 변경 발생 시에만 수정. Review 트리거: (a) idempotency table 생성 (b) OpenAPI 초안 커밋 (c) 첫 결제/환불 기능 merge.

국내 결제 초점: 초기 PG 연동은 국내(예: Toss, PortOne 등) 우선. 다국가/정기 결제 관련 코드는 생성 지양(명시 요구 전 만들지 말 것).
환불 정책(초기): '미 수강(진도 0%) + 일정 기간 내' 조건 충족 시 결제 취소/환불 처리; 로직/정책 상수는 별도 config 파일 도입 예정.

문의: 문서 출처는 README 및 docs/000.\* 스펙 파일. 불일치 발견 시 먼저 해당 스펙 갱신 → 본 파일 수정.

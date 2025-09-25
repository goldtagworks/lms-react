# 099_spec_audit — 스펙 종합 점검 & 갭 분석 (v3.4)

본 문서는 현재 리포의 문서/계약을 종합적으로 점검하고, 누락/모호/리스크 항목을 식별하여 To-Do로 정리한다. 모든 배포 게이트는 본 문서 기준으로 판단한다.

────────────────────────────────────────────────────
## A. 현재 포함 문서(요약)
- 000_overview.md: 개요/범위/성공지표
- 010_persona_journey.md: Persona & Journey(학습자/강사/관리자)
- 020_architecture.md: 아키텍처/폴더/데이터 액세스/보안
- 031_schema.sql, 032_rls.sql: DDL & RLS (섹션/리뷰/Q&A/위시/쿠폰/구독 포함)
- 040_edgespec.md: Edge(결제/구독/쿠폰 검증/채점/수료증/알림)
- 050_design_tokens.json: 디자인 토큰
- 051_copy_catalog.json: 카피/i18n 카탈로그(가격/리뷰/Q&A/쿠폰/구독/카테고리)
- 060_routes_and_components.md: 라우트/컴포넌트 계약(구독 플로우 포함)
- 061_screen_template.md: 화면 템플릿(샘플: Course Detail v3.4)
- 062_screens.md: 주요 화면 스토리보드(위시/리뷰/Q&A/쿠폰/구독)
- 070_payment_flow.md, 071_payment_errors.md: 결제 플로우/에러 매핑(세일/세금/통화/쿠폰)
- 080_exam_certificate.md, 081_exam_rules.md: 시험/채점/수료증(시간 제한 설정 포함)
- 090_quality_checklist.md: 품질 게이트/AC
- 091_accessibility.md, 092_mobile_rules.md: 접근성/모바일 규칙

────────────────────────────────────────────────────
## B. 갭 분석(Gap Analysis)
1) **OpenAPI 스펙 미생성/부족**
   - 현황: `openapi/edges.openapi.json` 없음.
   - 영향: 클라이언트 SDK/계약 테스트 자동화 불가.
   - 조치: 모든 엔드포인트를 포함해 작성.
     - 포함: `/payments/webhook`, `/subscriptions/webhook`, `/coupons/validate`, `/exams/grade`, `/certificates/issue`, `/qna/notify`
     - 공통 Error Schema: `code`, `message` (071의 코드 집합 반영)

2) **RLS 정책 테스트 부재**
   - 현황: 정책 정의만 있고 자동화 테스트 없음.
   - 영향: 권한 회귀 리스크.
   - 조치: `tests/rls/rls.spec.sql` 추가(코스 소유 강사/관리자/수강생/익명 별 권한 케이스).

3) **수학식/검색 성능**
   - 현황: 목록/검색은 기본 인덱스만 사용.
   - 영향: 대량 데이터에서 성능 저하 가능.
   - 조치: `courses(title, summary, tags)`에 FTS/트라이그램 인덱스 옵션 검토, 인기순/평점순 정렬을 위한 `v_course_metrics` 머티리얼라이즈드 뷰 주기 갱신 정책 추가.

4) **데이터 마이그레이션/시드 스크립트 부재**
   - 현황: 031 스키마 확장(소유 강사/가격/세금/쿠폰 등) 후 마이그레이션/시드 명시 없음.
   - 영향: 기존 데이터 호환/초기 데모 구축 지연.
   - 조치: `/db/migrations/2025-09-__-seed.sql`에 샘플 강사/코스/플랜/쿠폰/카테고리/섹션/레슨 추가. 기존 코스 `instructor_id`/통화/세금 기본값 보정 스크립트 포함.

5) **i18n 커버리지 점검 자동화 부재**
   - 현황: 051에 키 추가 완료. 커버리지 및 미사용 키 검증 도구 없음.
   - 영향: 미번역/중복 키 발생 가능.
   - 조치: `scripts/i18n-lint.ts`로 사용 키 대비 카탈로그 검증, CI에 포함.

6) **보안/웹훅 운영 규정 보강 필요**
   - 현황: HMAC 서명 규칙만 정의. 시크릿 로테이션/허용 IP/리플레이 방지(타임스탬프) 미정.
   - 조치: `/docs/000. AI 학습데이터/093_webhook_security.md`에 로테이션/RBAC/리플레이 윈도/허용 IP 명시.

7) **환불/정책 문서 미정**
   - 현황: 환불 조건/기한/부분환불 정책 상세 없음.
   - 조치: `/docs/000. AI 학습데이터/073_refund_policy.md` 작성.

8) **콘텐츠 보호/저장 정책 보강**
   - 현황: DRM/HLS 생략, 서명 URL TTL만 규정.
   - 조치: `/docs/000. AI 학습데이터/024_content_policy.md`에 프리사인 URL 재발급/도메인 제한/워터마크/다운로드 금지 지침 명시.

9) **관리자 화면 스토리보드(운영)**
   - 현황: 학습자 중심 화면 위주.
   - 조치: `/docs/000. AI 학습데이터/06b_screens_admin.md` 추가(코스/차시 CRUD, 기준% 설정, 진행 모니터링, 쿠폰/카테고리/구독 관리).

10) **관측/알람 임계치 튜닝**
   - 현황: 기본 임계치만 기재.
   - 조치: `/docs/000. AI 학습데이터/094_observability.md`에 메트릭(성공률/지연/오류율/쿠폰 실패율/통화 불일치)과 임계 히스토리 기록.

11) **백업/재해복구(DR) 계획 미정**
   - 현황: 스토리지/DB 백업 주기/보관주기 문서 없음.
   - 조치: `/docs/000. AI 학습데이터/095_backup_and_dr.md` 작성(일일 스냅샷, 7/30/180일 보관, 복원 리허설 주기).

────────────────────────────────────────────────────
## C. 권고 기본값(확정 필요)
- progress.watch_threshold = **0.9**
- exam.pass_score = **60**, retake.max_attempts = **3**, cooldown_hours = **24**, time_limit_minutes = **30**(미설정 시 기본)
- courses.pricing: tax_included = **true**, currency_code = **"KRW"**, sale_price 유효기간 기본 **미지정(null)**
- coupons: per_user_limit = **1**, max_redemptions = **null**, discount 우선순위 = percent → fixed
- subscription: interval = **month**, plan 기본 통화 = **KRW**
- storage.signed_url_ttl_hours = **2**
- rate_limit: coupon.validate = **20/min/IP**, webhook = **60/min/provider**

────────────────────────────────────────────────────
## D. 린트 규칙(문서/계약)
- 숫자 규칙은 모두 정수/실수로 표기(예: 60%)
- JSON 예시는 들여쓰기 코드블록(백틱 금지)
- 모든 에러는 errors 네임스페이스에 i18n 키 존재해야 함(071 기준)
- 문서/파일 넘버링은 실제 파일과 일치(예: **031_schema.sql / 032_rls.sql**)
- 060 라우트에 정의되지 않은 경로는 사용 금지

────────────────────────────────────────────────────
## E. To-Do 체크리스트
- [ ] **openapi/edges.openapi.json 생성** (결제/구독/쿠폰/채점/수료증/알림 포함)
- [ ] **tests/acceptance/payment_webhook.feature** 생성
- [ ] **tests/acceptance/subscription_webhook.feature** 생성
- [ ] **tests/acceptance/coupon_validate.feature** 생성
- [ ] tests/acceptance/learning_progress.feature 생성
- [ ] tests/acceptance/exam_certificate.feature 생성
- [ ] **tests/rls/rls.spec.sql** 생성(코스 소유/수강생/익명 권한 케이스)
- [ ] db/migrations/2025-09-__-seed.sql 작성(샘플 강사/코스/플랜/쿠폰/카테고리/섹션/레슨)
- [ ] docs/083_certificate_template.html 작성(로고/서명 포함 템플릿)
- [ ] docs/073_refund_policy.md 작성
- [ ] docs/024_content_policy.md 작성
- [ ] docs/06b_screens_admin.md 작성
- [ ] docs/093_webhook_security.md 작성
- [ ] docs/094_observability.md 작성
- [ ] **docs/095_backup_and_dr.md 작성**
- [ ] scripts/i18n-lint.ts 작성 + CI 통합

────────────────────────────────────────────────────
## F. 배포 게이트(Go/No-Go)
- No-Go 조건:
  - OpenAPI 스펙 미완료 또는 엔드포인트 누락
  - 3대 핵심 플로우 Gherkin 미완료(결제/구독/쿠폰)
  - RLS 테스트 미완료
  - 수료증 템플릿(083) 미완료
  - 환불정책(073) & 웹훅 보안(093) 미완료
- Go 조건:
  - 상기 문서/테스트 완료 + 090 품질 게이트 100% 충족

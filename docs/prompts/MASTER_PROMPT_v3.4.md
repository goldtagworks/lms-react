---
type: master-prompt
project: lms
version: 3.4
updated: 2025-09-26
steps:
  - id: 1
    key: context_scope
  - id: 2
    key: data_security
  - id: 3
    key: business_logic
  - id: 4
    key: ui_interaction
  - id: 5
    key: design_copy
  - id: 6
    key: payment
  - id: 7
    key: exam_certification
  - id: 8
    key: quality_guidelines
  - id: 9
    key: audit_gaps
llm_usage:
  temperature: 0.2
  style: concise-structured
notes: |
  본 문서는 AI 또는 신규 참여자가 프로젝트 전 범위를 순차적으로 이해/구현하기 위한 상위 지침입니다.
  일반 개발 온보딩 README와 분리되어 관리되며, 변경 시 버전 파일을 복제 후 수정합니다.
---
# LMS v3.4 — Master Prompt Skeleton

⚠️ 이 문서는 본 리포지토리의 **AI Master Prompt Skeleton**입니다.  
AI 또는 신규 참여자가 프로젝트를 이해하고 구현할 때, 어떤 문서를 어떤 순서로 참고해야 하는지 안내합니다.  
세부 스펙은 `docs/000. AI 학습데이터` 디렉토리에 있으며, 이 문서는 전체 설계/구현의 출발점입니다.

## Master Prompt for LMS v3.4

목표: 첨부된 문서 세트를 기준으로 **LMS v3.4**를 구현한다.  
진행 순서는 **Context → Data → Business Logic → UI → Design → Payment → Exam → Quality → Audit**이다.  
각 단계에서 문서의 내용을 기반으로, 명시된 Acceptance Criteria를 만족하는 산출물을 제출한다.  

---

## Step 1. Context & Scope
- Files:  
  - 000_overview.md  
  - 010_persona_journey.md  
  - 020_architecture.md  
- Tasks:  
  - 시스템 요약 다이어그램, 기능 목록, 역할별 목적 정리  
  - 리스크·가정 Top 10 도출  

---

## Step 2. Data & Security
- Files:  
  - 031_schema.sql  
  - 032_rls.sql  
- Tasks:  
  - DB 마이그레이션 및 시드 스크립트 생성  
  - RLS 정책 자동화 테스트(SQL) 작성  

---

## Step 3. Business Logic (Edge Functions)
- Files:  
  - 040_edgespec.md  
- Tasks:  
  - 엔드포인트 핸들러(TypeScript) 스켈레톤 생성  
  - HMAC 서명/멱등 처리 유틸 공통화  

---

## Step 4. UI & Interaction
- Files:  
  - 060_routes_and_components.md  
  - 061_screen_template.md  
  - 062_screens.md  
- Tasks:  
  - React Router 라우트 및 RoleGuard 구현  
  - 주요 컴포넌트 스텁 생성  
    - SectionList, ReviewList, QnaList  
    - WishlistButton, CouponInput  
    - PlanCard, SubscriptionStatusCard, PriceBadge  

---

## Step 5. Design & Copy
- Files:  
  - 050_design_tokens.json  
  - 051_copy_catalog.json  
- Tasks:  
  - Mantine v8 테마 구성  
  - i18n 키 커버리지 검사 스크립트 생성  

---

## Step 6. Payment
- Files:  
  - 070_payment_flow.md  
  - 071_payment_errors.md  
- Tasks:  
  - EPP(Effective Payable Price) 계산 유틸 구현  
  - 웹훅 금액 검증 로직 작성  
  - 에러 코드/UX 매핑 반영  

---

## Step 7. Exam & Certification
- Files:  
  - 080_exam_certificate.md  
  - 081_exam_rules.md  
- Tasks:  
  - 채점 엔진/타이머/쿨다운 로직 구현  
  - 수료증 PDF 템플릿 바인딩  

---

## Step 8. Quality & Guidelines
- Files:  
  - 090_quality_checklist.md  
  - 091_accessibility.md  
  - 092_mobile_rules.md  
- Tasks:  
  - 품질 게이트/접근성/모바일 대응 체크 자동 검증  

---

## Step 9. Audit & Gaps
- Files:  
  - 099_spec_audit.md  
- Tasks:  
  - OpenAPI 스펙(`openapi/edges.openapi.json`) 생성  
  - Gherkin 테스트 3종(결제/구독/쿠폰) 추가  
  - To-Do 체크리스트 기반 산출물 보강  
  - 최종 Go/No-Go 배포 판정  

# 020_architecture — 아키텍처 & 기술 스택

## Overview
- FE: Vite+React+Mantine v8+React Router+React Query+RHF/Zod+i18next
- BE: Supabase(Auth/RLS/DB/Storage)
- Serverless: Edge Functions(결제 웹훅, 채점, 수료증 발급, 쿠폰 처리, 리뷰/Q&A 관리)
- Observability: Edge 로그, 결제/채점/발급 이벤트 감사 로그

## Folder (FE)
src/
  app/ (라우팅/레이아웃)
  components/ (AppShell, CourseCard, ExamStartButton 등)
  features/
  courses/, enrollments/, lessons/, exams/, certificates/, reviews/, qna/, wishlist/, coupons/, categories/
  hooks/ (useAuth, useEnrollmentProgress, useExamEligibility)
  lib/ (supabase.ts, queryClient.ts, i18n.ts)
  locales/ (ko/en)
  styles/

## Data Access
- React Query 키 규칙: 
  - `['course', id]`, `['lessons', courseId]`, `['enrollment', id]`, `['progress', enrollmentId]`, `['exam', id]`
  - `['sections', courseId]`, `['reviews',{courseId,page}]`, `['qna',{courseId,page}]`, `['wishlist','me']`, `['coupons',filters,page]`, `['categories']`, `['metrics', courseId]`
- 쓰기: Supabase RPC/insert/update (민감 로직은 Edge로 위임)

## Env
- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Edge: SUPABASE_SERVICE_ROLE_KEY, MAIL_API_KEY, PG_WEBHOOK_SECRET

## Security
- RLS 필수. 모든 쓰기는 소유자 체크.
- Storage: 비공개 버킷 + 서명 URL TTL ≤ 2h.
- 강사 소유권 기반 RLS (courses/sections/lessons). 리뷰/Q&A는 수강생/강사 권한만 허용. 쿠폰/카테고리는 admin 전용.

## Deployment & 결제 범위
- FE: Vercel/Netlify
- Edge: Supabase Functions, cron(task) 선택적
- 결제: 초기 국내 PG 위주(Toss, PortOne 등) 단건 결제만 지원.

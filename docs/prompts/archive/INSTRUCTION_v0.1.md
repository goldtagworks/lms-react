---
version: 0.1
stage: foundations
source_steps: [1,2]
updated: 2025-09-26
audience: dev+ai
scope: "코스/수강/진도/RLS/초기 FE 스캐폴딩/멱등 유틸 사전 정의"
next_release_target: v0.8
---
# Instruction v0 (Foundations)
> ⚠️ 최신 버전은 v1.2(`INSTRUCTION_v1.2.md`)입니다. 이 문서는 역사적 참고용입니다.
> Step1~2 문서(Overview, Personas, Architecture, Schema, RLS) 기반 초기 구현 지침. 결제/시험/수료/품질 세부는 Placeholder 처리.

> (아카이브 체인: v0 → v0.8 → v0.9 → v0.95 → v1.0 → v1.1 → v1.2)

## 1. 목표 (Objective)
5일 이내에 아래 기반을 구축한다:
- 스키마 & RLS 가정 반영한 DB 초기화/시드 스크립트
- FE 프로젝트 기본 구조(라우팅/레이아웃/i18n/Query Client/Design System Theme)
- Edge 공통 유틸(HMAC, 멱등 저장, 표준 에러 포맷) 스켈레톤
- 학습(코스 목록/상세/수강 등록/진도 반영) 최소 플로우

## 2. 범위 (In-Scope)
| 영역 | 포함 |
|------|------|
| Auth | Supabase Auth 클라이언트 래퍼, 세션 fetch 훅 |
| 코스 | 목록/상세 조회, instructor 拥有자 구분(표기) |
| 수강 | ENROLLED 상태 반영 (임시로 수동 트리거) |
| 진도 | lesson_progress upsert API 어댑터, 퍼센트 계산 조회 |
| UI | 레이아웃 Shell, 기본 Nav, 라이트 테마 |
| 국제화 | i18n 초기 세팅(ko/en) & 디자인 토큰 적용 자리 |
| 품질 | ESLint + TS strict + Prettier + 기본 테스트 1개 |

Out-of-scope (Placeholder): 결제 로직, 쿠폰, 구독, 시험, 채점, 수료증, OpenAPI 정식 스펙.

## 3. FE 폴더 구조 (초기)
```
src/
  app/
    main.tsx
    router.tsx
    layout/RootLayout.tsx
  lib/
    supabaseClient.ts
    queryClient.ts
    i18n.ts
    auth.ts
  features/
    courses/
      api/ (fetchCourses.ts, fetchCourse.ts)
      components/ (CourseCard.tsx, CourseList.tsx)
      hooks/ (useCourses.ts, useCourse.ts)
    enrollments/
      api/ (enrollCourse.ts, fetchEnrollment.ts)
      hooks/ (useEnrollment.ts)
    progress/
      api/ (upsertLessonProgress.ts, fetchProgress.ts)
      hooks/ (useProgress.ts)
  components/
    LayoutShell.tsx
    Loading.tsx
    ErrorBoundary.tsx
  styles/
    theme.ts
  locales/
    ko/common.json
    en/common.json
```

## 4. React Query 키 규칙
```
['courses']
['course', courseId]
['enrollment', enrollmentId]
['progress', enrollmentId]
['lessons', courseId]
```
정책: 키 첫 요소는 단수/복수 명사 기준 도메인, 파라미터 객체는 순서 고정.

## 5. Environment (.env) 변수 (초안)
| 변수 | 예시 | 공개 여부 | 설명 |
|------|------|-----------|------|
| VITE_SUPABASE_URL | https://xyz.supabase.co | Public | Supabase 프로젝트 URL |
| VITE_SUPABASE_ANON_KEY | (anon key) | Public | public anon key |
| SUPABASE_SERVICE_ROLE_KEY | (secret) | Secret | Edge Functions 서버측 권한 |
| MAIL_API_KEY | (secret) | Secret | 수료증/알림 메일 발송 |
| PG_WEBHOOK_SECRET | (secret) | Secret | 결제/웹훅 서명 검증 |

## 6. Edge Functions 공통 유틸 (스켈레톤 요구사항)
| 유틸 | 목적 | 최소 인터페이스 |
|------|------|----------------|
| hmacVerify | 웹훅/서명 검증 | `(payload: string, signature: string, secret: string) => boolean` |
| idempotencyStore | 멱등 처리 | `record(key: string, ttlSeconds?: number): Promise<boolean /*isNew*/>` |
| errorFactory | 에러 표준화 | `createError(code: string, http: number, meta?)` |
| roleGuard | 역할 검사 | `requireRole(roles: Role[])` |
| auditLog | 주요 이벤트 로깅 | `log(event: string, data: object)` |

초기에는 in-memory/mock → 추후 KV/테이블 전환.

## 7. 초기 백로그 (Sprint 0/1)
우선순위 P1 > P2 > P3.
| ID | P | 작업 | 산출물 |
|----|---|------|--------|
| 1 | P1 | Vite+TS+ESLint+Prettier 세팅 | 기본 프로젝트 런칭 |
| 2 | P1 | Supabase 클라이언트 + Auth Hook | `useAuth()` |
| 3 | P1 | Query Client + ErrorBoundary + Layout Shell | AppShell 렌더 |
| 4 | P1 | Courses List/Detail Fetch | CourseCard/상세 페이지 |
| 5 | P1 | Enrollment 생성(임시 버튼) | `enrollCourse()` |
| 6 | P1 | Lesson Progress upsert (mock) | `upsertLessonProgress()` |
| 7 | P1 | Progress 퍼센트 표시 | 진행 바 컴포넌트 |
| 8 | P2 | i18n 초기 세팅 + locale 스위처 | ko/en 전환 |
| 9 | P2 | 디자인 토큰 theme.ts 반영 | Mantine Theme 객체 |
| 10 | P2 | 테스트 러너(Vitest) + 1 샘플 | sanity test |
| 11 | P3 | Edge 유틸 스켈레톤 5종 | util 함수 stub |
| 12 | P3 | CI 워크플로 초안(lint+type) | github workflow |

## 8. 위험 & 대응 (Foundations 단계)
| 리스크 | 신호 | 예방/대응 |
|--------|------|-----------|
| Auth 세션 동기 지연 | 새로고침 후 null | `onAuthStateChange` 구독 + 캐시 warm |
| Progress 반영 느림 | UI 지연/점프 | optimistic 업데이트 + 백그라운드 refetch |
| Query 키 혼선 | 중복 fetch | 키 규칙 문서화 + lint rule(선택) |
| 멱등 유틸 미구현 | 중복 결제 처리 위험(후속) | placeholder + 경고 주석 |
| 다국어 누락 | 하드코딩 문자열 증가 | i18n extractor 스크립트 계획 주석 |

## 9. 폴더/코드 컨벤션
- features/<domain>/api: 순수 데이터 호출 (Supabase/Edge) 모듈
- features/<domain>/hooks: Query 래퍼 (캐시 키 일관성)
- components: 재사용 UI(도메인 비침투)
- lib: cross-cutting concerns(환경/i18n/auth/query)
- 파일명: React 컴포넌트 PascalCase, 훅 useXxx.ts, API 함수 동사+명사 fetch/enroll/upsert

## 10. 타입 & 에러 코드 프리뷰
```
// error codes (예정)
E_AUTH_REQUIRED
E_INVALID_ROLE
E_NOT_FOUND
E_CONFLICT
E_RATE_LIMIT
E_IDEMPOTENT_REPLAY
```
Edge 유틸 createError로 표준화 예정.

## 11. Placeholder 선언 (v0 한정)
- 결제(EPP 계산, webhook idempotency) → v0.8
- 시험(타이머/셔플/쿨다운) → v0.8
- 수료증(PDF 템플릿/시리얼) → v0.8
- OpenAPI 자동 생성 → v1.0
- i18n coverage 체크 스크립트 → v1.0

## 12. 완성 정의 (Definition of Done: v0)
| 항목 | 기준 |
|------|------|
| 로컬 실행 | `pnpm dev` 로 기본 AppShell + 코스 목록 mock 표시 |
| Auth | 로그인/로그아웃 상태 UI 반영(간단) |
| Progress | 퍼센트 UI (mock or 계산) |
| ESLint/TS | 오류 0 |
| 테스트 | 최소 1 passing |

## 13. 다음 단계 전 승격 조건 → v0.8
- Edge Spec(040) 학습 완료 후 각 Function 인터페이스 테이블화
- 결제/시험/수료/구독/쿠폰 플로우 dependency 정리
- util 멱등 구현을 메타스토어(예: table idempotency_keys)로 전환 초안

---
Instruction v0 끝. v0.8 업데이트 시 결제/시험 도메인 세부 및 에러 코드 표 확장.

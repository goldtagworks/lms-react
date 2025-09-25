# 060_routes_and_components — 라우트 & 컴포넌트 계약

이 문서는 어떤 AI 모델이든 동일한 화면 구조/컴포넌트 계약으로 구현하도록 고정 규격을 제공합니다. (단일 도메인, 역할: **admin | instructor | learner**)

────────────────────────────────────────────────────
## 1) 라우트 맵(공통)

경로 | 인증 | 목적 | 주요 데이터 의존성(React Query 키) | 주요 액션
---|---|---|---|---
`/` | public | 홈(히어로/추천 코스/가이드 링크) | `['courses','featured']` | 코스 보기, 가이드 보기
`/courses` | public | 코스 목록(필터/검색/페이지) | `['courses',filters,page]` | 필터 변경, 검색, 페이지 이동
`/course/:id` | public | 코스 상세(탭: 개요/커리큘럼/리뷰/Q&A/강사) | `['course',id]`, `['lessons',id]`, `['sections',id]`, `['reviews',id]`, `['qna',id]`, `['instructor',id]` | 결제 시작(위젯), 가이드 열람, 리뷰 작성, Q&A 참여
`/login` | public | 로그인/회원가입 | 없음 | 로그인/회원가입/비번 재설정
`/my` | auth | 나의 강의실(ENROLLED 목록/진도/시험/수료증) | `['enrollments','me']`, `['progress','batch']`, `['certs','me']` | 학습 시작, 시험 응시, 수료증 다운로드
`/my/wishlist` | auth | 찜 목록 | `['wishlist','me']` | 찜 추가/제거
`/subscription/plans` | public | 구독 플랜 목록 | `['plans','active']`, `['features',planId]` | 구독 시작
`/my/subscription` | auth | 내 구독 상태/청구 내역 | `['userSubscription','me']`, `['invoices','me']` | 해지/관리
`/learn/:enrollmentId` | auth | 레슨 플레이어(진도 저장) | `['enrollment',enrollmentId]`, `['lessons','byEnrollment',enrollmentId]`, `['progress',enrollmentId]` | 시청/세그먼트 저장, 완료 처리
`/exam/:examId/attempt` | auth | 시험 응시(타이머/셔플/제출) | `['exam',examId]`, `['questions',examId]` | 임시저장, 제출, 재응시
`/certificate/:certId` | auth | 수료증 보기/다운로드 | `['certificate',certId]` | PDF 다운로드/메일 재전송
`/instructor/courses` | auth+role(instructor|admin) | 강의 목록/생성/편집 | `['courses','mine']` | 생성, 수정, 공개/비공개 전환
`/instructor/courses/:id/edit` | auth+role(instructor|admin) | 코스/커리큘럼 편집 | `['course',id]`, `['lessons',id]` | 레슨 CRUD, 순서변경
`/instructor/:id` | public | 강사 프로필 | `['profile',id]`, `['courses','byInstructor',id]` | 프로필 보기
`/admin/users` | auth+role(admin) | 사용자/역할 관리 | `['users',page,q]` | 역할 변경, 비활성화
`/admin/certificates` | auth+role(admin) | 수료증 발급/재발급 관리 | `['certs',filters,page]` | 재발급, 메일 재전송
`/admin/coupons` | auth+role(admin) | 쿠폰 관리 | `['coupons',filters,page]` | 생성, 수정, 삭제
`/admin/categories` | auth+role(admin) | 카테고리 관리 | `['categories']` | 생성, 수정, 삭제
`/admin/subscriptions` | auth+role(admin) | 구독 플랜 관리 | `['plans',filters,page]` | 생성, 수정, 비활성화

가드 규칙:
- **인증 라우트(auth)**는 미로그인 시 `/login`으로 리다이렉트.
- **역할 가드**: `/instructor/*`는 `instructor|admin`만, `/admin/*`은 `admin`만 접근.
- `/exam/:examId/attempt` 진입 전 `eligibility = progress >= required` 검사. 미달이면 `/learn/:enrollmentId`로 안내.
- 결제 완료 전 ENROLLED 상태를 **프론트에서 변경 금지**. 웹훅 확정 시에만 반영.
- 구독 화면: /subscription/plans 은 public, /my/subscription 은 auth, /admin/subscriptions 은 admin 전용.

────────────────────────────────────────────────────
## 2) 내비게이션/가드 흐름

- 전역 가드: 로그인 상태/역할(**admin|instructor|learner**), 토큰 유효성 검사.
- 메뉴 노출: 
  - learner: Home, Courses, My, Wishlist
  - instructor: + Instructor(코스 관리, My Profile)
  - admin: + Admin(사용자/수료증 관리, Coupons, Categories)
- 페이지 진입 전 프리페치: 상세 페이지는 주요 쿼리(prime) 2개까지 사전 로드.
- 결제 후: 프론트에서 ENROLLED 직접 토글 금지. "결제 처리 중" 배너 → **웹훅 완료** 시점에만 My로 이동/리프레시.

────────────────────────────────────────────────────
## 3) 페이지별 데이터 계약

### 홈(`/`)
- 의존성: `['courses','featured']` (최대 8개)
- 상태: loading / empty / error / ready
- AC: empty면 "추천 강좌가 준비 중입니다" 메시지.

### 코스 목록(`/courses`)
- 입력: `filters={level, type, q, category, priceType, ratingGte}`, `page`, `sort`
- 의존성: `['courses',filters,page]`
- AC: 서버 페이징 필수. 각 카드는 응시 기준%를 표시.

### 코스 상세(`/course/:id`)
- 탭: 개요, 커리큘럼, 리뷰, Q&A, 강사 프로필
- 의존성: `['course',id]`, `['lessons',id]`, `['sections',id]`, `['reviews',id]`, `['qna',id]`, `['instructor',id]`
- 액션: 결제 시작 → 위젯 결과 대기 → 웹훅 대기 배너 노출, 리뷰 작성, Q&A 참여, 위시리스트 토글, 쿠폰 적용
- 상태: coupon.invalid, coupon.expired, wishlist.loading, wishlist.error
- 에러: E_COURSE_NOT_FOUND → 404 템플릿

### 마이 강의실(`/my`)
- 의존성: `['enrollments','me']`, `['progress','batch']`, `['certs','me']`
- 카드 상태 스위칭:
  - progress < required → [학습하기]
  - progress ≥ required & 미합격 → [시험 응시]
  - 합격 & 수료증 존재 → [수료증 다운로드]

### 찜 목록(`/my/wishlist`)
- 의존성: `['wishlist','me']`
- AC: 찜 추가/제거 가능, 빈 상태 메시지 표시

### 레슨 플레이어(`/learn/:enrollmentId`)
- 의존성: `['enrollment',enrollmentId]`, `['lessons','byEnrollment',enrollmentId]`, `['progress',enrollmentId]`
- 저장 규칙: 30초 세그먼트, 90% 이상 시 `is_completed=true`.
- 실패 시: 로컬 큐 적재 후 재전송 버튼 표시.

### 시험 응시(`/exam/:examId/attempt`)
- 의존성: `['exam',examId]`, `['questions',examId]`
- UI: 타이머, 진행바, 문항 카드, [임시저장]/[제출]
- 규칙: 30분 타이머, 탭 이탈 3회 경고 후 자동 제출, 셔플.

### 수료증(`/certificate/:certId`)
- 의존성: `['certificate',certId]`
- 동작: PDF 서명 URL 생성(≤2h), 다운로드/메일 재전송

### 강의 관리(`/instructor/courses`)
- 의존성: `['courses','mine']`
- 동작: 생성/편집/공개 전환, 레슨 CRUD, 순서변경 드래그앤드롭
- AC: 저장 성공 시 토스트, 낙관적 UI 사용 금지(서버 결과 반영 후 확정)

### 강사 프로필(`/instructor/:id`)
- 의존성: `['instructor',id]`
- AC: 프로필 보기 및 편집 가능

### 사용자 관리(`/admin/users`)
- 의존성: `['users',page,q]`
- 동작: 역할 변경(`admin|instructor|learner`), 사용자 비활성화
- AC: 본인 계정을 learner로 다운그레이드 불가(서버 검증)

### 수료증 관리(`/admin/certificates`)
- 의존성: `['certs',filters,page]`
- 동작: 재발급, 메일 재전송
- AC: 재발급 시 기존 serial은 유지/이력 기록

### 쿠폰 관리(`/admin/coupons`)
- 의존성: `['coupons',filters,page]`
- 동작: 쿠폰 생성, 수정, 삭제
- AC: 유효기간 및 중복 체크

### 카테고리 관리(`/admin/categories`)
- 의존성: `['categories']`
- 동작: 카테고리 생성, 수정, 삭제

### 구독 플랜 목록(`/subscription/plans`)
- 의존성: `['plans','active']`, `['features',planId]`
- 상태: loading / empty / error / ready
- 액션: [구독하기] 클릭 → 구독 결제 위젯 → 결과 처리(웹훅)

### 내 구독 관리(`/my/subscription`)
- 의존성: `['userSubscription','me']`, `['invoices','me']`
- 상태: active / past_due / canceled / incomplete
- 액션: [해지하기] → cancel_at_period_end=true 반영

### 구독 플랜 관리(`/admin/subscriptions`)
- 의존성: `['plans',filters,page]`
- 동작: 플랜 생성/수정/비활성화
- AC: admin만 접근 가능

────────────────────────────────────────────────────
## 4) 컴포넌트 계약(Props/이벤트)

아래 인터페이스는 프레임워크 무관하며, 타입은 참고용입니다.

- AppShell
    props: { brandTitle: string }

- CourseCard
    props: { id: string, title: string, level?: string, priceCents: number, progressRequiredPercent: number, onClick?: (id:string)=>void }

- FilterBar
    props: { level?: string, type?: string, category?: string, q?: string, sort?: string, onChange: (next:{level?:string,type?:string,category?:string,q?:string,sort?:string})=>void }

- CurriculumList
    props: { lessons: Array<{id:string,title:string,durationSeconds:number,orderIndex:number}> }

- SectionList
    props: { sections: Array<{id:string,title:string,lessons:Array<{id:string,title:string,durationSeconds:number}>}> }

- ReviewList
    props: { reviews: Array<{id:string,author:string,rating:number,content:string,date:string}> }

- ReviewForm
    props: { courseId: string, onSubmit: (review:{rating:number,content:string})=>void }

- QnaList
    props: { questions: Array<{id:string,author:string,question:string,answers:Array<{id:string,author:string,answer:string}>}> }

- QnaForm
    props: { courseId: string, onSubmit: (question:string)=>void }

- AnswerForm
    props: { questionId: string, onSubmit: (answer:string)=>void }

- ExamStartButton
    props: { progressPercent: number, requiredPercent: number, onStart: ()=>void }
    enable rule: progressPercent >= requiredPercent

- LessonPlayer
    props: { enrollmentId: string, lessons: Array<...>, onSegment: (payload:{lessonId:string, watched:number})=>void, onComplete:(lessonId:string)=>void }

- PaymentNotice
    props: { status: 'idle'|'processing'|'delayed'|'paid'|'failed', provider?: 'portone'|'toss'|'stripe' }

- PDFDownloadButton
    props: { url: string, fileName: string }

- EmptyState
    props: { icon?: string, title: string, description?: string, action?: {label:string,onClick:()=>void} }

- RoleGuard (신규)
    props: { allow: Array<'admin'|'instructor'|'learner'>, children: ReactNode }
    behavior: 세션의 `profile.role`이 allow에 포함될 때만 children 렌더

- WishlistButton
    props: { courseId: string, isWishlisted: boolean, onToggle: (courseId:string)=>void }

- CouponInput
    props: { value: string, onChange: (code:string)=>void, onApply: () => void }

- PriceBadge
    props: { pricingMode: 'free'|'paid'|'subscription', listPriceCents?: number, salePriceCents?: number, currencyCode?: string, saleEndsAt?: string }

- PlanCard
    props: { id:string, name:string, listPriceCents:number, salePriceCents?:number, currencyCode:string, features?: string[], onSubscribe: (id:string)=>void }

- SubscriptionStatusCard
    props: { planName:string, status:'active'|'past_due'|'canceled'|'incomplete', periodStart:string, periodEnd:string, invoices:Array<{id:string, amountCents:number, currencyCode:string, billedAt:string}> }

────────────────────────────────────────────────────
## 5) React Query 키 규약

- 단건: ['course', id], ['exam', id], ['certificate', certId], ['instructor', id]
- 리스트: ['courses', filters, page], ['enrollments','me'], ['users', page, q], ['certs', filters, page], ['coupons', filters, page], ['categories'], ['plans','active'], ['features', planId]
- 종속: ['lessons', courseId], ['lessons','byEnrollment',enrollmentId], ['sections', courseId], ['reviews', courseId], ['qna', courseId], ['wishlist', 'me']
- 파생: ['progress', enrollmentId], ['progress','batch'], ['metrics', courseId], ['userSubscription','me'], ['invoices','me']

StaleTime 기본 60s, retry 1회, 실패 시 알림 + 재시도 버튼.

────────────────────────────────────────────────────
## 6) 로딩/빈/오류 상태 규칙

- 로딩: 스켈레톤(카드/리스트/폼) 표시.
- 빈: 통일 메시지 i18n `common.empty` 사용 + 보조 액션(예: 코스 둘러보기).
- 오류: i18n 키 매핑 후 재시도 버튼. 404는 전용 템플릿.

────────────────────────────────────────────────────
## 7) i18n 키(발췌)

- common: { retry, loading, empty }
- course: { eligibility, learn, takeExam, downloadCert, curriculum, reviews, qna, instructor }
- pay: { processing, delayed, cancelled, error }
- exam: { timeLeft, unanswered, submitConfirm }
- role: { admin, instructor, learner }
- price: { currency, discount, original }
- filter: { level, type, category, sort, searchPlaceholder }
- sort: { newest, popular, priceAsc, priceDesc }
- review: { write, submit, rating, content, date }
- qna: { ask, answer, submit, noQuestions }
- wishlist: { added, removed, empty }
- coupon: { apply, invalid, expired, success, remove }
- subscription: { subscribe, manage, active, expired, plan }

────────────────────────────────────────────────────
## 8) 접근성(A11y)

- 페이지 진입 시 주요 제목(h1)로 포커스 이동.
- 키보드 Tab 순서: 핵심 CTA → 부 CTA → 링크.
- 대비 4.5:1 이상, 포커스 링 표시, 버튼 role/aria-label 명시.

────────────────────────────────────────────────────
## 9) 테스트 수용 기준(AC)

- AC1: 코스 카드에는 응시 기준%가 항상 표시된다.
- AC2: 결제 완료 전 ENROLLED 상태는 프론트에서 변경되지 않는다(웹훅만 변경).
- AC3: 진도 < 기준 시 ExamStartButton은 비활성화.
- AC4: 시험 제출 후 뒤로가기로 재응시 불가(쿨다운/횟수 준수).
- AC5: 모든 목록 페이지는 서버 페이징을 사용한다.
- AC6: `/instructor/*`는 instructor|admin만 접근 가능하다.
- AC7: `/admin/*`은 admin만 접근 가능하다.
- AC8: 코스 상세 커리큘럼(SectionList) 정상 노출 및 순서 일치.
- AC9: 리뷰 작성 및 목록(ReviewList/ReviewForm) 정상 동작 및 최신 리뷰 표시.
- AC10: Q&A 참여 및 답변( QnaList/QnaForm/AnswerForm) 정상 동작.
- AC11: 찜(WishlistButton) 상태 동기화 및 목록(`/my/wishlist`) 정상 표시.
- AC12: 쿠폰 입력(CouponInput) 후 유효성 검사 및 적용 정상 처리.
- AC13: 필터 및 정렬(FilterBar) 변경 시 목록이 올바르게 갱신되고 URL에 반영된다.
- AC14: /subscription/plans에서 활성 플랜이 표시되고, [구독하기]를 누르면 결제 플로우로 연결된다.
- AC15: /my/subscription에서 현재 구독 상태와 청구 내역이 정확히 표시된다.
- AC16: /admin/subscriptions는 admin만 접근 가능하다.

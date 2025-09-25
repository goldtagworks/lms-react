# 062_screens — 화면별 스토리보드

본 문서는 `/docs/000. AI 학습데이터/06a_screen_template.md` 템플릿을 기반으로 작성된 주요 화면 스토리보드이다.  
각 화면은 목적/데이터 계약/상호작용/수용 기준까지 정의한다.

────────────────────────────────────────────────────
## 홈 (/)

1. 목적/행동: 추천 코스 확인, 가이드/공지 접근
2. 접근: public
3. 레이아웃: Hero, CourseCard 그리드(최대 8개), 가이드 링크
4. 데이터: ['courses','featured']
5. 상태: loading / empty("추천 강좌가 준비 중입니다") / error / ready
6. AC: empty 상태시 안내 메시지 표시

────────────────────────────────────────────────────
## 코스 목록 (/courses)

1. 목적/행동: 전체 코스 탐색, 검색/필터
2. 접근: public
3. 레이아웃: FilterBar, CourseCard 그리드, Pagination
4. 데이터: ['courses',filters,page]
5. 상태: loading / empty("등록된 강의가 없습니다") / error / ready
6. AC: 서버 페이징, 각 카드에 응시 기준% 표시

────────────────────────────────────────────────────
## 코스 상세 (/course/:id)

1. 목적/행동: 코스 설명 확인, 결제 시작
2. 접근: public (결제 버튼은 auth 필요)
3. 레이아웃: HeroCard(title, price, required%), SectionList(미리보기 강의 포함), Tabs(Reviews/Q&A/Instructor), CTAGroup
4. 데이터: ['course',id], ['lessons',id], ['sections',id], ['reviews',{id,page}], ['qna',{id,page}]
5. 상태: loading / empty / error / ready / coupon.invalid / coupon.expired
6. 상호작용: [결제] 클릭 → PG 위젯 → "처리 중" 배너 → 웹훅 후 ENROLLED, WishlistButton 토글(로딩/에러 상태 처리), CouponInput 검증, Review/QnA 작성 폼
7. 에러: E_COURSE_NOT_FOUND → common.error.notFound, E_COUPON_INVALID → coupon.error.invalid, E_COUPON_EXPIRED → coupon.error.expired
8. AC: ENROLLED는 웹훅만 설정, 프론트 변경 금지, 수강생만 리뷰/Q&A 작성 가능, 위시리스트 토글은 본인만

────────────────────────────────────────────────────
## 마이 강의실 (/my)

1. 목적/행동: ENROLLED 강좌 목록 관리, 학습/시험/수료증 진입
2. 접근: auth
3. 레이아웃: CourseCardGrid(진도율/버튼 상태 표시)
4. 데이터: ['enrollments','me'], ['progress','batch'], ['certs','me']
5. 카드 상태:
   - progress < required → [학습하기]
   - progress ≥ required & 미합격 → [시험 응시]
   - 합격 & 수료증 존재 → [수료증 다운로드]
6. AC: 각 카드에 "현재 진도 x% / 기준 y%" 표시

────────────────────────────────────────────────────
## 레슨 플레이어 (/learn/:enrollmentId)

1. 목적/행동: 차시 학습, 진도 저장
2. 접근: auth
3. 레이아웃: VideoPlayer, ProgressBar, LessonNav
4. 데이터: ['enrollment',id], ['lessons','byEnrollment',id], ['progress',id]
5. 규칙: 30초 세그먼트 저장, 90% 이상 시 is_completed=true
6. 예외: 네트워크 실패 → 로컬 큐 적재, 재전송 버튼
7. AC: 학습 종료 시 진도율 업데이트

────────────────────────────────────────────────────
## 시험 응시 (/exam/:examId/attempt)

1. 목적/행동: 시험 응시/제출
2. 접근: auth, eligibility 검사
3. 레이아웃: Timer, ProgressBar, QuestionCard, [임시저장]/[제출]
4. 데이터: ['exam',id], ['questions',id]
5. 규칙: 30분 타이머, 탭 이탈 3회 후 자동 제출, 셔플
6. AC: 타이머 만료시 자동 제출, 합격 시 certificates 생성

────────────────────────────────────────────────────
## 결제 확인 (위젯/웹훅)

1. 목적/행동: 결제 상태 안내
2. 접근: auth
3. 레이아웃: PaymentNotice(status)
4. 상태:
   - processing: "결제를 처리하고 있습니다…"
   - delayed: 30s 경과시 지연 안내
   - paid: My 페이지로 이동
   - failed/cancelled: 원화면 유지 + 알림
5. AC: 웹훅만 ENROLLED 설정, 프런트 변경 금지

────────────────────────────────────────────────────
## 로그인/회원가입 (/login)

1. 목적/행동: 계정 생성, 로그인
2. 접근: public
3. 레이아웃: AuthForm(email/password), SocialLogin(옵션)
4. 데이터: Supabase Auth
5. 상태: loading / error / ready
6. AC: 성공 시 redirect=/my, 실패 시 에러 메시지(i18n auth.error)

────────────────────────────────────────────────────
## 관심 강좌 목록 (/my/wishlist)

1. 목적/행동: 관심 강좌 목록 관리
2. 접근: auth
3. 레이아웃: CourseCardGrid
4. 데이터: ['wishlist','me']
5. AC: 비로그인 시 redirect=/login, 토글 시 리스트 반영

────────────────────────────────────────────────────
## 강사 프로필 (/instructor/:id)

1. 목적/행동: 강사 정보 및 강의 목록 공개
2. 접근: public
3. 레이아웃: ProfileCard, CourseCardGrid
4. 데이터: ['profile',id], ['courses','byInstructor',id]
5. AC: 강사 정보와 강의 목록 동시 표시

────────────────────────────────────────────────────
## 쿠폰 관리 (/admin/coupons)

1. 목적/행동: 쿠폰 관리
2. 접근: admin
3. 레이아웃: Table, Form
4. 데이터: ['coupons',filters,page]
5. AC: admin만 접근 가능

────────────────────────────────────────────────────
## 카테고리 관리 (/admin/categories)

1. 목적/행동: 카테고리 관리
2. 접근: admin
3. 레이아웃: Table, Form
4. 데이터: ['categories']
5. AC: admin만 접근 가능

────────────────────────────────────────────────────
## 구독 플랜 목록 (/subscription/plans)

1. 목적/행동: 제공되는 구독 플랜 확인 및 가입
2. 접근: public
3. 레이아웃: PlanCardGrid(name, price, sale, features), SubscribeButton
4. 데이터: ['plans','active'], ['features',planId]
5. 상태: loading / empty("구독 플랜이 없습니다") / error / ready
6. 상호작용: [구독하기] 클릭 → PG 위젯 → subscriptions-webhook 처리 후 ENROLLED 가능
7. AC: 플랜 가격/세일/세금 표시, 클릭 시 결제 플로우로 연결

────────────────────────────────────────────────────
## 내 구독 관리 (/my/subscription)

1. 목적/행동: 현재 구독 상태 확인/해지
2. 접근: auth
3. 레이아웃: SubscriptionStatusCard(plan, period_start, period_end, status), CancelButton
4. 데이터: ['userSubscription','me'], ['invoices','me']
5. 상태: active / past_due / canceled / incomplete
6. 상호작용: [해지하기] 클릭 시 cancel_at_period_end=true 반영
7. AC: 상태별 안내문구 표시, 청구 내역 리스트 노출

────────────────────────────────────────────────────
## 구독 플랜 관리 (/admin/subscriptions)

1. 목적/행동: 구독 플랜 CRUD
2. 접근: admin
3. 레이아웃: Table, Form
4. 데이터: ['plans',filters,page]
5. AC: admin만 접근 가능
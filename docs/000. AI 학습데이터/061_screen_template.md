# 061_screen_template — 화면 명세 템플릿 (공통)

본 문서는 모든 화면 문서를 작성할 때 동일한 구조를 따르도록 하는 템플릿이다.  
각 화면별 스토리보드(`/docs/000. AI 학습데이터/06b_screens/*`) 작성 시 이 구조를 복사하여 채운다.

────────────────────────────────────────────────────
## 1. 화면명 / 경로
- 예: 코스 상세 (/course/:id)

## 2. 목적 / 사용자 행동
- 화면 목적, 주요 사용자 행동 정의

## 3. 접근 권한
- public | auth | admin 등 접근 제약
- 미충족 시 리다이렉트 경로

## 4. 레이아웃 / 주요 모듈
- HeroCard, CourseCard, CurriculumList 등
- 모듈/컴포넌트 나열

## 5. 데이터 계약
- 주요 쿼리키 (React Query)
- 반환 데이터 스키마
- 변환 규칙/포맷팅

## 6. 상태 / 상호작용
- 상태: loading / empty / error / ready
- 상호작용: 버튼 클릭 → 액션 → 결과
- 예외: 네트워크 실패, 권한 없음

## 7. 검증 / 에러 메시지
- i18n 키 매핑
- 각 에러 코드 → 메시지/대응

## 8. 접근성 (A11y)
- h1 포커스 이동
- Tab 순서
- role/aria-label 규칙

## 9. 트래킹 / 로깅
- 이벤트 이름 정의
- 파라미터 구조

## 10. 수용 기준 (Acceptance Criteria)
- AC1, AC2, AC3 … 구체적이고 테스트 가능한 조건

## 11. 테스트 절차 (Gherkin 예시)
- Given / When / Then 시나리오

────────────────────────────────────────────────────
샘플:

### [화면명] Course Detail (/course/:id)

1. 목적/행동: 
   - 코스 정보 확인, 결제 시작, 커리큘럼(섹션) 열람
   - 수강평(리뷰) 확인 및 작성, Q&A 확인 및 질문, 위시리스트 추가, 쿠폰 입력
2. 접근: 
   - public. 결제, 리뷰/질문/위시리스트/쿠폰 등 일부는 auth 필요
   - 결제/리뷰/질문/위시리스트/쿠폰 시 미로그인 → /login 리다이렉트
3. 레이아웃/주요 모듈: 
   - HeroCard (코스 요약)
   - SectionList (커리큘럼/섹션)
   - CTAGroup (결제/ENROLLED/위시리스트/쿠폰)
   - ReviewList (수강평 목록, 리뷰 작성)
   - QnaList (Q&A 목록, 질문 등록)
   - InstructorCard (강사 프로필)
   - WishlistButton (내 위시리스트 토글)
   - CouponInput (쿠폰 입력)
4. 데이터 계약:
   - ['course', id]         // 코스 상세
   - ['sections', id]       // 섹션/커리큘럼
   - ['reviews', {id, page}] // 리뷰 목록(페이지네이션)
   - ['qna', {id, page}]    // Q&A 목록(페이지네이션)
   - ['profile', instructorId] // 강사 프로필
5. 상태:
   - loading / empty / error / ready
6. 상호작용:
   - [결제] → PG 위젯 → "처리 중" 모달 → 웹훅 후 ENROLLED
   - [위시리스트 추가] → 내 목록에 추가/제거
   - [쿠폰 입력] → 쿠폰 유효성 확인 → 가격 조정
   - [리뷰 작성] → 수강생만 가능, 중복 방지
   - [질문 등록] → 수강생만 가능
7. 검증/에러:
   - E_COURSE_NOT_FOUND → common.error.notFound
   - E_COUPON_INVALID → coupon.error.invalid
   - E_REVIEW_DUP → review.error.duplicate
8. A11y: 
   - h1 포커스, 주요 버튼 aria-label, 섹션별 landmark/role
9. 트래킹/로깅:
   - view_course(id)
   - click_pay(id)
   - toggle_wishlist(id, on/off)
   - apply_coupon(id, coupon)
   - submit_review(id, rating)
   - submit_question(id)
10. 수용 기준 (Acceptance Criteria):
   - AC1. 결제 성공 후 ENROLLED 상태 및 CTA 변경
   - AC2. 수강생만 리뷰 작성 가능, 중복 리뷰 불가
   - AC3. 수강생만 Q&A 질문 가능
   - AC4. Wishlist 토글은 본인만 가능
   - AC5. 쿠폰 적용 시 최종 가격 반영
11. 테스트:
   - Given 코스 존재 / When 쿠폰 유효 / Then 가격 조정
   - Given 미수강생 / When 리뷰 작성 / Then 차단됨
   - Given 수강생 / When 리뷰 작성 / Then 등록됨
   - Given 이미 리뷰 작성 / When 리뷰 재작성 / Then E_REVIEW_DUP
   - Given 로그인 유저 / When 위시리스트 토글 / Then 상태 반영
   - Given 비로그인 / When 결제 or 위시리스트 or 리뷰 or Q&A 시도 / Then /login 리다이렉트
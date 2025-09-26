# 010_persona_journey — 페르소나 & 사용자 여정

## Personas
### Student(학습자)
- 목표: 원하는 강의 수강, 결제, 학습, 기준 충족 후 시험 응시, 수료증 획득, 찜 목록 관리, 쿠폰 사용, 강의 리뷰 작성, Q&A 참여
- Pain: 결제 실패/지연, 진도 반영 오차, 시험 중 네트워크 이슈, 원하는 강의 찾기 어려움, 쿠폰 적용 오류, 리뷰 작성 불편

### Admin(관리자)
- 목표: 강의/차시 CRUD, 응시 기준% 설정, 진행/수료 모니터링, 쿠폰 생성 및 관리, 카테고리 관리
- Pain: 잘못된 설정/데이터 변경으로 인한 혼선, 쿠폰 중복 발급, 카테고리 분류 오류

### Instructor(강사)
- 목표: 강의 제작 및 수정, 강의별 수강생 관리, Q&A 답변, 리뷰 확인 및 피드백 제공
- Pain: 강의 등록 지연, 수강생 문의 대응 지연, 리뷰 부정확성

## Journeys (텍스트 다이어그램)

### Student
1) 홈/코스목록 → 필터링/카테고리 선택 → 코스상세(응시 기준% 노출)
2) [찜하기] → 찜 목록 관리
3) [쿠폰 적용] → 결제 페이지 이동 → PG 위젯 → “처리 중” 상태
4) 웹훅 성공 → ENROLLED → 마이강의실 카드 활성화
5) 레슨 학습(세그먼트 저장, 레슨 완료) → 진도율 상승
6) 진도≥코스 기준 → [시험 응시] 활성화
7) 시험(객관식, 타이머, 셔플) → 제출
8) 채점(Edge) → 합격 시 수료증 발급(Edge) → PDF/메일 수신
9) 강의 리뷰 작성 및 수정
10) Q&A 질문 및 답변 확인/참여

예외/에러:
- PG 취소/지연/중복, 웹훅 미도착(지연 메시지+새로고침), 네트워크 실패(재시도), 타이머 만료(자동 제출), 쿠폰 적용 실패

### Instructor
1) 로그인 → 강사 대시보드
2) 강의 생성/수정(차시, 자료 업로드)
3) 수강생 현황 및 진도 모니터링
4) Q&A 답변 및 관리
5) 리뷰 확인 및 피드백 제공

### Admin
1) 로그인 → 관리자 메뉴
2) 강의 생성/수정(가격, 응시 기준%) → 차시 등록(순서/길이/URL)
3) 쿠폰 생성/수정/삭제 및 발급 관리
4) 카테고리 생성/수정/삭제
5) 진행/수료 현황 확인

## 화면 매핑(발췌)

단계 | 화면 | 주요 데이터 | 예외 처리
---|---|---|---
결제 | `/course/:id` | course, price, required% | PG 취소/지연/중복
학습 | `/learn/:enrollmentId` | lessons, progress | 네트워크 실패 시 세그먼트 큐 재전송
시험 | `/exam/:examId/attempt` | questions, timer | 탭 이탈 경고 3회 후 자동 제출
수료증 | `/certificate/:certId` | pdf_path | 링크 만료 시 재발급 안내
찜 목록 | `/wishlist` | wishlist items | 동기화 오류
쿠폰 | `/coupon` | available coupons, applied coupon | 쿠폰 중복 적용, 만료
리뷰 | `/review/:courseId` | user reviews, rating | 제출 실패, 중복 리뷰 방지
Q&A | `/qna/:courseId` | questions, answers | 네트워크 지연, 중복 질문 방지
강사 프로필 | `/instructor/:instructorId` | profile, courses, Q&A | 데이터 로드 실패
관리자 쿠폰 | `/admin/coupons` | coupon list, usage stats | 중복 쿠폰 생성 방지
관리자 카테고리 | `/admin/categories` | category list, course counts | 삭제 제한, 분류 오류

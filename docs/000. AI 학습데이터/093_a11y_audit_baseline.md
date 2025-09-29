# A11y Baseline Audit (v0.1)

Generated: 2025-09-29
Scope Pages: Home, Course List, Course Detail, My Page, Auth (SignIn/SignUp), Global Layout (Header/Nav/Footer), Modal/Tooltip primitives
Excluded (later): Player, Exam, Certificate Print

## 1. 검사 체크리스트

| Category    | Item                   | 기준                                    | 상태(샘플)                             | 메모                                    |
| ----------- | ---------------------- | --------------------------------------- | -------------------------------------- | --------------------------------------- |
| Headings    | 단일 H1                | 페이지 당 1개                           | 일부 미사용 (PageHeader div 구조)      | PageHeader를 H1 옵션 허용 필요          |
| Headings    | 계층 순서              | H 레벨 건너뛰기 없음                    | 대체로 ok, Detail 내 섹션 H2/H3 불명확 | Section 컴포넌트 headingOrder 전략 필요 |
| Landmarks   | main 사용              | 단 1개                                  | PageContainer roleMain 있음            | ok                                      |
| Landmarks   | header/nav/footer      | 존재 & 목적 구분                        | header/nav ok, footer ok               | nav aria-label 필요                     |
| Skip Link   | 본문 바로가기          | 키보드 탭 시 표시                       | 없음                                   | 추가 필요 (t('a11y.skipToContent'))     |
| Focus       | 포커스 링              | 기본 브라우저/커스텀                    | 대체로 브라우저                        | Mantine reset 영향 확인 필요            |
| Keyboard    | Tab 순서               | 논리적 순서                             | 구조상 문제 없음 추정                  | 실측 테스트 필요                        |
| Interactive | Tabs role              | proper tab/tabpanel                     | Mantine Tabs role 제공                 | ok (aria-selected 확인)                 |
| Interactive | Modal focus trap       | 열릴 때 첫 focus, ESC 닫힘              | Mantine modals OK                      | 테스트 필요                             |
| Interactive | Tooltip 접근성         | hover-only 아닌가                       | Tooltip focus 접근 가능                | aria-describedby 자동화 확인            |
| Toggle      | 찜하기 버튼 명확 label | 상태 전달 (aria-pressed 또는 라벨 변화) | 라벨 변화로 전달                       | aria-pressed 추가 고려                  |
| Buttons     | Icon-only label        | aria-label 제공                         | ActionIcon 다수 OK                     | 전수 재확인 필요                        |
| Images      | 대체텍스트             | 의미 이미지 alt 제공                    | AppImage alt 전달                      | 빈 alt 처리 가이드 필요                 |
| Lists       | 시맨틱 목록            | Cards/레슨 목록 ul/ol                   | Curriculum ul 적용                     | CourseList 카드 div -> ul 추천          |
| Live Region | 알림/토스트            | role='alert' 또는 aria-live             | notifications lib 확인 필요            | wrapper 커스터마이즈 고려               |
| Contrast    | 텍스트 대비            | WCAG AA                                 | 미측정                                 | Token 기반 측정 스크립트 ToDo           |
| Motion      | 감속 지원              | prefers-reduced-motion 존중             | 애니메이션 거의 없음                   | ok                                      |
| Forms       | label/input 연결       | label prop/aria-label                   | Mantine 기본 label 사용                | ok                                      |

## 2. 우선순위 분류

- P1 (구조): Skip Link 부재, 단일 H1 미보장, nav aria-label 미통일, CourseList 시맨틱 목록 미사용
- P2 (상태 전달/상호작용): 찜하기 aria-pressed, notifications aria-live, 모달 포커스/ESC 회귀 테스트
- P3 (품질): Contrast 자동 점검, 아이콘 버튼 전체 라벨 검증, 빈 alt 가이드 문서화

## 3. 수정 계획 매핑

| 이슈                | 대응                                                | 범위                  | 단계 |
| ------------------- | --------------------------------------------------- | --------------------- | ---- |
| Skip Link 없음      | Global layout에 visually-hidden 링크 추가           | MainLayout            | 1차  |
| 단일 H1 미보장      | PageHeader에 as='h1' 옵션 & 페이지별 1곳 지정       | PageHeader, 각 페이지 | 1차  |
| nav aria-label      | Header/Nav 컴포넌트에 t('a11y.mainNav') 적용        | Header/Nav            | 1차  |
| 목록 시맨틱         | CourseList 페이지 카드 래퍼 ul/li 구조 변경         | CourseListPage        | 1차  |
| 찜 토글 ARIA        | AppButton 내부 role/button + aria-pressed 속성 추가 | EnrollWishlistActions | 2차  |
| notifications live  | provider wrapper role='status' aria-live='polite'   | Notifications root    | 2차  |
| Modal focus 재검    | 수동 테스트 + 회귀 자동화 draft                     | 모달 전역             | 2차  |
| Contrast            | design tokens 추출 → 색상 대비 계산 스크립트        | tokens/theme          | 3차  |
| Icon-only 라벨 감사 | grep ActionIcon aria-label 빠진 항목 보강           | 전역                  | 1차  |
| 빈 alt 정책         | AppImage alt='' 처리 지침 README/i18n 키            | 문서                  | 3차  |

## 4. 리스크 & 영향

- Skip Link/H1 도입은 DOM 구조 최소 변경 → 낮은 리스크.
- 목록 시맨틱 변경은 CSS 영향 가능: list-style reset 필요.
- aria-pressed 도입은 UI 회귀(스타일) 가능성 → 테스트 필요.
- notifications aria-live 추가 시 중첩 읽기 발생 주의(중복 토스트 burst 제한 필요).

## 5. 측정 지표(Definition of Done)

- Axe (심각/치명) 0 (샘플: Home, Course List, Course Detail 3페이지)
- H1 exactly 1 per audited page
- Skip link Tab 1회 진입 시 포커스 표시
- 찜 토글 스크린리더 announce: "찜하기, 버튼" ↔ "찜 해제, 버튼" (또는 aria-pressed 상태)
- CourseList 카드 컨테이너 role=list / 항목 role=listitem (또는 ul/li)

## 6. 후속 자동화 후보

- scripts/a11y-smoke.mjs: playwright + axe-core 세 페이지 스캔
- design tokens → contrast 계산: scripts/contrast-check.mjs

## 7. 차기 액션 (정렬)

1. MainLayout Skip Link + H1 옵션 지원
2. Header/Nav aria-label 통일
3. CourseListPage 목록 시맨틱화
4. Icon-only ActionIcon aria-label 전수 점검
5. (이후 2차) 찜하기 aria-pressed, notifications live region

---

(End of Baseline v0.1)

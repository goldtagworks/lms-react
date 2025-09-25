---
version: 0.9
stage: foundations+edge+ui
source_steps: [1,2,3,4]
updated: 2025-09-26
audience: dev+ai
supersedes: INSTRUCTION_v0.8.md
scope: "Foundations + Edge + UI/Routes/Components/A11y/Test AC" 
next_release_target: v1.0
---
# Instruction v0.9 (Edge + UI Integration)
> v0.8에 UI 라우트/컴포넌트 계약, 상태 패턴, A11y, 테스트 AC 확장.

> 🔔 최신 버전(v0.95, Design Tokens & Copy 통합)은 `INSTRUCTION_v0.95.md` 를 참고하세요.

## 1. 추가 목적 (v0.9)
- UI 라우트/역할 가드/React Query 키 스키마를 코드 스캐폴딩에 직접 매핑.
- 시험/결제/수료 관련 CTA 상태 전이를 FE 컴포넌트 계약으로 구체화.
- A11y & 상태 처리(loading/empty/error/coupon/eligibility) 공통 패턴 확립.

## 2. 라우트 가드 계층
| 계층 | 책임 | 구현 제안 |
|------|------|-----------|
| AuthGuard | 로그인 확인 → 미로그인시 /login | `useAuth()` + redirect |
| RoleGuard | 역할 배열 허용 검사 | prop allow: Role[] |
| ExamEligibilityGuard | progress ≥ required 검사 | progress & enrollment fetch 후 분기 |

라우트 구성: `createBrowserRouter` + lazy import; prefetch는 useEffect로 핵심 1~2 쿼리만.

## 3. 상태 패턴 DSL
| 상태 | 공통 컴포넌트 |
|------|---------------|
| loading | Skeleton / Spinner |
| empty | <EmptyState icon title description action?> |
| error | <ErrorState code retry?> |
| processing(payment) | <PaymentNotice status="processing" /> |
| coupon.invalid | CouponInput 내부 상태 표시 |
| eligibility.locked | ExamStartButton disabled |

## 4. 핵심 컴포넌트 계약(요약)
(세부는 060/062 원문 참조)
- CourseCard, SectionList, ReviewList, QnaList, WishlistButton, CouponInput, PlanCard, SubscriptionStatusCard, PriceBadge, ExamStartButton, LessonPlayer, PaymentNotice, PDFDownloadButton, FilterBar, EmptyState, RoleGuard.

## 5. Query Key 카테고리화
| 카테고리 | 키 예시 |
|----------|---------|
| 단건 | ['course',id], ['exam',id], ['certificate',certId] |
| 리스트(필터) | ['courses',filters,page], ['users',page,q], ['coupons',filters,page] |
| 관계 | ['lessons',courseId], ['sections',courseId], ['reviews',courseId] |
| 사용자 컨텍스트 | ['enrollments','me'], ['wishlist','me'], ['userSubscription','me'] |
| 파생/집계 | ['progress',enrollmentId], ['metrics',courseId], ['progress','batch'] |

정책: `filters` 객체는 직렬화 안전한 고정 키 순서(JSON.stringify with stable). 빈 값은 생략하지 말고 null 명시.

## 6. UI 상태 전이 (결제/학습/시험/수료)
```
PENDING_ENROLL -> (webhook paid) -> ENROLLED -> (progress >= required) -> ELIGIBLE_FOR_EXAM -> (exam passed) -> CERT_ISSUED
```
프론트는 ENROLLED 이전 전이를 "optimistic" 처리 금지.

## 7. 시험 흐름 (FE 관점)
| 단계 | 이벤트 | 결과 |
|------|--------|------|
| 시작 | ExamStartButton 클릭 | attempt row 생성 (미채점) |
| 진행 | 답안 임시저장 (local state) | 비제출 상태 유지 |
| 제출 | 제출 API → /exams/grade | score/passed 수신 |
| 합격 | passed=true | 수료증 issue 비동기 트리거 |
| 발급 | certificate polling or SSE (optional) | 다운로드 버튼 활성 |

## 8. 접근성 표준 (확장)
| 요소 | 규칙 |
|------|------|
| 페이지 전환 | h1에 `tabIndex=-1` 후 focus() |
| 버튼 | 최소 aria-label, disabled 상태 시 이유 sr-only |
| 리스트 | role=list / listitem 일관성 |
| 폼 라벨 | 모든 input은 `<label for>` 또는 aria-label |
| 키보드 | Tab 순서 논리(CTA → 필터 → 목록) |

## 9. 테스트 수용 기준(통합)
AC1~AC16 (v0.8) + 아래 추가:
- AC17: /exam/:examId/attempt 타이머 만료 자동 제출 → 점수 반영
- AC18: 결제 지연 30s 초과 시 PaymentNotice=delayed
- AC19: wishlist 토글 후 /my/wishlist 리스트 즉시 반영
- AC20: progress 90% 이상 시 lesson is_completed true 반영
- AC21: 구독 webhook 처리 후 /my/subscription 상태 업데이트
- AC22: 인증 없는 /admin/* 접근 시 /login 리다이렉트 후 원래 경로 복구

## 10. 추천 디렉토리 추가 (v0.9)
```
src/
  guards/ (AuthGuard.tsx, RoleGuard.tsx, ExamEligibilityGuard.tsx)
  components/state/ (EmptyState.tsx, ErrorState.tsx, Skeletons.tsx)
  features/payment/ (PaymentNotice.tsx, usePaymentStatus.ts)
  features/exam/ (ExamStartButton.tsx, useExamAttempt.ts, useExamTimer.ts)
  features/certificate/ (CertificateDownload.tsx)
```

## 11. 개발 순서 제안(병렬)
| 트랙 | 단계 |
|------|------|
| A (Core) | Router + Guards + Layout |
| B (Course) | 목록/상세 + Wishlist/Coupon stub |
| C (Progress) | LessonPlayer + progress upsert mock |
| D (Exam) | Attempt 생성 + Grade mock + Timer hook |
| E (Subscription) | Plans 목록 + webhook mock 반영 |
| F (Certificate) | Polling + 다운로드 버튼 |

## 12. 상태/에러 매핑 테이블(초안)
| 에러 코드 | UI 메시지 키 | Retry 버튼 | 토스트 |
|-----------|--------------|------------|-------|
| E_COURSE_NOT_FOUND | common.error.notFound | 홈으로 이동 | warn |
| E_COUPON_INVALID | coupon.error.invalid | 재입력 | info |
| E_WEBHOOK_INVALID_SIG | pay.error.webhook | 숨김 | error |
| E_ALREADY_GRADED | exam.info.graded | 숨김 | info |
| E_CERT_ALREADY_ISSUED | cert.info.exists | 숨김 | info |

## 13. OpenAPI 준비 체크리스트 (사전)
- 각 Edge 응답 스키마 Zod 정의 후 generate
- paths: /payments/webhook, /subscriptions/webhook, /coupons/validate, /exams/grade, /certificates/issue, /qna/notify
- 공통 components.schemas.Error { code, message }
- components.schemas.PaymentWebhookPayload ... (등)

## 14. 성능 & 최적화(초기)
| 주제 | 전략 |
|------|------|
| 초기 로드 | code-splitting (탭/관리자 라우트 lazy) |
| 캐시 | progress batch fetch → map 반영 |
| Prefetch | detail hover 시 lessons/sections prefetch |
| 재렌더 | 메모화: CourseCard, PlanCard, SectionList |

## 15. 남은 갭(→ v1.0)
| 카테고리 | 갭 | 해소 계획 |
|----------|----|-----------|
| Payment | EPP 계산 함수 미구현 | Step6 후 반영 |
| Exam | Anti-cheat(포커스 이탈 카운트) 로직 미구현 | Step7 후 구체화 |
| Certificate | PDF 템플릿/시리얼 시퀀스 미정 | Step7 후 확정 |
| OpenAPI | Zod→OpenAPI 파이프라인 없음 | 스크립트 `gen:openapi` |
| i18n Coverage | 미사용/누락 키 검출 스크립트 부재 | design/copy Step5 후 |
| Mobile Rules | 반응형 규칙 미적용 | Step8 후 반영 |

## 16. Definition of Done (v0.9)
| 항목 | 기준 |
|------|------|
| Router & Guards | 인증/역할/시험 자격 가드 동작 |
| Course Detail | Wishlist/Coupon UI 상태 전이 구현 (mock) |
| Progress Flow | LessonPlayer 세그먼트 저장 & complete 처리(mock) |
| Exam Mock | Grade 호출 후 점수 UI 반영 |
| Subscription Mock | webhook 호출 후 상태 카드 업데이트 |
| Certificate Mock | issue 후 다운로드 버튼 활성 |
| Error Mapping | 최소 5개 에러 코드 UI 매핑 |
| A11y | 주요 페이지 h1 포커스 이동 확인 |

---
Instruction v0.9 끝. 다음: Step5~6 학습 후 Design Tokens & Payment(EPP) 통합 → v1.0 후보.

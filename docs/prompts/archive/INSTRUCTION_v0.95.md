---
version: 0.95
stage: foundations+edge+ui+design
source_steps: [1,2,3,4,5]
updated: 2025-09-26
audience: dev+ai
supersedes: INSTRUCTION_v0.9.md
scope: "Edge+UI + Design Tokens + Copy/i18n Coverage 전략" 
next_release_target: v1.0
---
# ⚠️ 최신 버전 안내: 이 문서는 v1.0(`INSTRUCTION_v1.0.md`)에 의해 대체되었습니다. 새로운 결제(EPP/에러/상태머신) 내용은 v1.0을 참고하세요.
# Instruction v0.95 (Design & Copy Integration)
> v0.9에 디자인 토큰(색상/타이포/레이아웃/반응형) 및 Copy Catalog(i18n) 전략, 커버리지 검증 프로세스 추가.

## 1. 디자인 토큰 적용 원칙
| 분류 | 소스(JSON) | Mantine 매핑 | 비고 |
|------|------------|--------------|------|
| 색상 | colors.* | theme.colors (primary, accent 등) | scale 확장 시 suffix(700) 유지 |
| 반경 | radius | theme.defaultRadius | px 단위 그대로 |
| 그림자 | shadow | theme.shadows.sm(or custom) | 재사용: 카드/모달 |
| 컨테이너 최대폭 | containerMax | 전역 LayoutShell maxWidth | rem 변환(1200→75rem) |
| 그리드 간격 | gridGap | theme.spacing.xl (커스텀) | spacing map에 추가 |
| 폰트 패밀리 | fontFamily | theme.fontFamily | 한/영 fallback 유지 |
| heading weight | headings.fontWeight | theme.headings.fontWeight | 600 유지 |
| breakpoints | breakpoints.* | theme.breakpoints | xs/sm/md/lg 적용 |

토큰 → theme 변환 유틸: `buildTheme(tokensJson) => MantineThemeOverride`.

## 2. 반응형 규칙 (초안)
| 뷰포트 | 규칙 |
|--------|------|
| < sm (≤768) | 2열 이하 카드, Hero 단일 열, 네비게이션 Drawer |
| md (≤1024) | 3열 카드, 사이드 패널 접힘 |
| lg (≤1200) | 기본 4열, 컨테이너 1200px 제한 |
| > lg | 중앙 정렬, 양측 여백 증가 |

## 3. 컴포넌트 디자인 적용 지침
| 컴포넌트 | 색상/토큰 | 상태 표기 |
|----------|-----------|-----------|
| Primary 버튼 | colors.primary / hover: primary700 | disabled: opacity .5 |
| Accent 버튼 | colors.accent | hover: shade(accent, -8%) |
| 성공 배지 | colors.green | text on dark 대비 4.5:1 확보 |
| 카드 | radius + shadow | hover: shadow 강조(알파 ↑) |
| 배경 섹션 | gray50 | 구분 border 색상: border |
| 구독 플랜 강조 | accent 경계선 + 약한 배경 | sale 존재 시 PriceBadge 강조 |

## 4. i18n Copy Catalog 전략
- 네임스페이스: 단일 JSON(초기) → 성장 시 domain 분할(`course.json`, `exam.json`).
- Placeholder 형식: `{{var}}` → i18next interpolate.
- 미사용 키 검출: 런타임 수집 vs 정적 AST 스캔(후속 스크립트 목표).
- 누락 키 검출: 기본 언어(ko) → en에서 누락 시 빌드 경고.

## 5. 커버리지 검증 파이프라인(제안)
| 단계 | 도구 | 설명 |
|------|------|------|
| 추출 | 스크립트(scan) | `src/**/*.{ts,tsx}`에서 `t('...')` 패턴 추출 |
| 비교 | Node script | copy_catalog keys 세트와 diff |
| 리포트 | CI | 누락(N) / 미사용(U) / 존재(O) |

출력 예:
```
I18N Coverage Report
Missing: 3 (course.newFeature, exam.timerPause, subscription.renew)
Unused: 5 (legacy.key1, legacy.key2, ...)
Total: used 120 / defined 125 (96%)
```

## 6. i18n 키 네이밍 규칙
| 규칙 | 예시 |
|------|------|
| 소문자+카멜 또는 snake 지양 → dot 구분 | course.listTitle |
| 액션 동사 앞 | review.write, coupon.apply |
| 상태/플래그 명사 | exam.failed, subscription.active |
| 에러코드 직접 매핑 | errors.E_DUP_TX |

## 7. 에러코드 ↔ Copy 매핑 동기
- Edge ErrorCode 먼저 정의 → Copy Catalog에 `errors.<CODE>` 키 추가.
- FE 에러 핸들러: code 존재 → `t('errors.'+code)` fallthrough → generic.
- 누락 시 logger.warn("Missing i18n for error:", code).

## 8. Theme 빌드 의사코드
```ts
import tokens from '../../docs/000. AI 학습데이터/050_design_tokens.json';

export function buildTheme(t: typeof tokens): MantineThemeOverride {
  return {
    colors: {
      primary: [t.colors.primary],
      accent: [t.colors.accent]
    },
    primaryColor: 'primary',
    fontFamily: t.fontFamily,
    headings: { fontFamily: t.fontFamily, fontWeight: t.headings.fontWeight },
    other: {
      containerMax: t.containerMax,
      gridGap: t.gridGap
    },
    shadows: { md: t.shadow },
    radius: { md: t.radius },
    breakpoints: {
      xs: t.breakpoints.xs,
      sm: t.breakpoints.sm,
      md: t.breakpoints.md,
      lg: t.breakpoints.lg
    }
  };
}
```
(실 구현 시 색상 팔레트 확장 필요 → 배열 10스텝 구성 or 동적 생성)

## 9. 다국어 확장 (en 기본 스캐폴드)
- en 초기에는 ko 대비 동일 키 구조 + 값은 영문 번역(미작성 시 fallback ko).
- 후속: `missing_en.json` 자동 생성해 번역자 워크플로.

## 10. Design QA 체크리스트
| 항목 | 기준 |
|------|------|
| 컬러 대비 | WCAG AA (텍스트 4.5:1) |
| 포커스 링 | 기본 브라우저 또는 커스텀 명확히 표시 |
| 라운딩 | radius 12 일관 |
| 그림자 남용 | 동일 레벨 계층 반복 제한 |
| 반응형 | 4단계 breakpoint 레이아웃 준수 |
| 타이포 | Heading weight 600 유지 |

## 11. UI 토큰 회귀 테스트 아이디어
- 스토리북(후속)에서 Visual Regression(Chromatic or Storycap) 계획.
- build 시 tokens hash → 변경 로그 출력.

## 12. Copy 변경 워크플로
| 단계 | 설명 |
|------|------|
| 수정 PR | 051_copy_catalog.json 변경 → PR 템플릿에 변경 이유 기입 |
| CI 검증 | i18n diff 스크립트 실행 (누락/미사용 표시) |
| 리뷰 | 제품/콘텐츠 검토 라벨 붙임 |
| 머지 | 버전 태그(optional) |

## 13. 누락/미사용 키 전략 (초기 수동)
- 누락: 개발 중 console.warn
- 미사용: 월 1회 스크립트 output 확인 후 제거

## 14. v1.0 전 필수 TODO 업데이트
| 카테고리 | 준비 |
|----------|------|
| Theme 색상 팔레트 | primary/accent 10단계 확장 | 색상 유틸 도입 |
| i18n Coverage Script | AST 스캐너 작성 | glob + babel/parser |
| en 번역 | 빠진 키 자동 보고 | missing_en.json |
| Token Freeze | v1.0 태그 시 tokens hash 기록 | 회귀 비교 |

## 15. Definition of Done (v0.95)
| 항목 | 기준 |
|------|------|
| Theme 적용 | buildTheme 기반 Mantine override 생성 (stub 가능) |
| Token Usage | 최소 3개 컴포넌트(primary button, card, badge)에 토큰 반영 |
| Copy Catalog | t() 호출 10곳 이상, 누락 경고 없음 |
| Error Mapping | Edge 오류 10개 이상 i18n 치환 |
| Coverage Report | (임시) 수동 diff 문서화 |

## 16. 다음 단계 (→ v1.0)
- Step6 결제(EPP, 금액 검증, 에러 UX) → Payment 엔진 스펙 추가
- Step7 시험/수료 상세(쿨다운/포커스이탈) → Anti-cheat 로직
- Step8 품질 게이트(a11y 자동 검사, mobile 규칙) → CI 작업
- Step9 Audit → OpenAPI + Gherkin 3종 + Gap 해소 체크리스트

---
Instruction v0.95 끝. 다음: Payment & Exam 포함한 v1.0 준비.

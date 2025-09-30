<!-- Human-facing project README (AI Master Prompt moved to docs/prompts/) -->

# LMS

현대 교육 코스·시험·결제/쿠폰·수료 체계를 통합 제공하는 모듈형 학습 관리 플랫폼입니다.

> AI용 전체 구현 워크플로우(Master Prompt)는 `docs/prompts/MASTER_PROMPT_LATEST.md` 를 참조하세요.

## 주요 기능 (Features)

- 코스 카탈로그 & 섹션 구조
- 가격(EPP 계산)
- 결제 & 쿠폰 & 웹훅 검증
- 시험(타이머/채점/쿨다운) & 수료증 발급
- RLS 기반 접근 제어
- 디자인 토큰 & 다국어(i18n) 카탈로그

## Tech Stack (초안)

- React (UI) / Mantine v8 (Design System)
- Edge Functions (TypeScript 기반, 스펙: `040_edgespec.md`)
- PostgreSQL + RLS (스키마: `031_schema.sql` / 정책: `032_rls.sql`)
- (예정) 테스트: Vitest 또는 Jest, e2e: Playwright

## 디렉토리 개요 (현재 단계)

```
docs/
  000. AI 학습데이터/   # 세부 도메인 스펙
  prompts/               # AI Master Prompt 및 버전
openapi/ (예정)          # 자동 생성 OpenAPI 산출물
src/ (예정)              # 애플리케이션 구현
```

## 시작하기 (Getting Started)

현재 저장소는 주로 스펙 문서 위주입니다. 구현이 진행되면 아래 절차가 추가될 예정입니다.

1. Node & 패키지 매니저 버전 정의 (TODO)
2. `.env.example` 작성 후 `cp .env.example .env`
3. 의존성 설치: `pnpm install` (또는 npm/yarn 결정 필요)
4. DB 마이그레이션 & 시드: `pnpm db:migrate && pnpm db:seed` (예정)
5. 개발 서버 실행: `pnpm dev` (예정)

## 문서 (Documentation)

| 주제                | 위치                                                   |
| ------------------- | ------------------------------------------------------ |
| AI Master Prompt    | `docs/prompts/MASTER_PROMPT_LATEST.md`                 |
| 아키텍처 개요       | `docs/000. AI 학습데이터/020_architecture.md`          |
| 데이터 스키마       | `docs/000. AI 학습데이터/031_schema.sql`               |
| RLS 정책            | `docs/000. AI 학습데이터/032_rls.sql`                  |
| Edge Functions Spec | `docs/000. AI 학습데이터/040_edgespec.md`              |
| 라우트 & 화면       | `docs/000. AI 학습데이터/060_routes_and_components.md` |
| 결제 흐름           | `docs/000. AI 학습데이터/070_payment_flow.md`          |
| 시험 & 수료증       | `docs/000. AI 학습데이터/080_exam_certificate.md`      |
| 품질 체크리스트     | `docs/000. AI 학습데이터/090_quality_checklist.md`     |

## 향후 품질 게이트 (초안)

- Lint & TypeCheck: 오류 0
- 테스트 커버리지: (기준 확정 예정 ≥ 70%)
- 접근성: 주요 화면 axe 오류 0
- i18n: 누락 키 0 / 미사용 키 자동 리포트
- OpenAPI: Git 비교 시 Breaking 변경 CI 경고

## i18n 운영 가이드

본 프로젝트는 커스텀 `useI18n` 훅 기반 단일 플랫(flat) 네임스페이스(`ui.json`) 구조를 사용합니다. `react-i18next` 는 제거되었으며 재도입 금지(혼합 사용 시 경고 및 키 누락 혼선).

핵심 규칙:

1. Canonical Locale = `ko` (항상 먼저 추가) → 영어(`en`)는 점진적 보강.
2. 새 문자열 추가 순서: `src/locales/ko/ui.json` 에 키 추가 → 필요 시 동일 경로의 `en/ui.json` 에 placeholder 또는 실제 번역.
3. 키 네이밍: 기능 영역 루트(prefix) 유지. 예: `nav.courses`, `support.ticket.new`, `faq.items.payments.question`.
4. FAQ 항목: slug 기반 `faq.items.<slug>.question` 키 자동 조회. Frontmatter에 `question` 직접 기입 시 그것이 우선.
5. 런타임 미존재 키: 콘솔 경고(개발 모드) + fallback = 원본 키 문자열.
6. 클라이언트 임의 재계산 / 서버 파생 필드명(`effective*`) 등은 번역 대상이 아님(표시 그대로 사용).

폴더 구조:

```
src/locales/
  ko/ui.json  # 기준(전체 키 집합)
  en/ui.json  # 부분 또는 전체 번역(미존재는 lint에 의해 보고)
```

번역 키 점검:

```
yarn i18n:lint
```

출력:

- Missing: ko에는 있으나 en에 없는 키 목록
- Orphan: en에만 존재(삭제 또는 ko로 역보강 필요)

운영 플로우(팀 권장):

1. 기능 구현 중 새 UI 텍스트 필요 → 우선 한국어 키 추가 & 사용
2. PR 직전 `yarn i18n:lint` 실행하여 Missing/Orphan 검토
3. 영어 번역이 아직 준비 안된 경우 placeholder(동일 한국어) 허용, 단 PR 설명에 TODO 명시
4. 대량 누락 발생 시(>30) 별도 번역 태스크로 분리

주의사항:

- 다국어 추가 시 기존 키 수정(renaming)은 Breaking Change → 검색 후 전면 교체 및 리뷰어에게 알림.
- 중첩 오브젝트를 문자열이 아닌 다른 타입(배열/숫자 등)으로 두지 말 것 (lint 스크립트는 string leaf만 키로 간주).
- 공백/문장부호만 다른 중복 메시지는 재사용 키 탐색 후 결정(불필요한 변형 지양).

향후 확장(Optional):

- CI: `yarn i18n:lint` 결과 Missing > 0 이면 경고 또는 실패 처리
- 타입 세이프티: 생성 스크립트로 `t('...')` 오타 방지용 union 타입 자동 생성 (추후 필요 시)

요약: 모든 다국어 변경은 ko 기준 단일 소스 유지, lint로 차이 모니터링, slug 기반 FAQ 자동화로 운영 비용 최소화.

## 버전 정책

- 현재 아티팩트 기준 버전: v3.4 (Master Prompt)
- `CHANGELOG.md` 도입 예정

## 기여 (Contributing)

`CONTRIBUTING.md` 추가 예정입니다. 단기적으로는 PR 작성 시:

1. 변경 범위 명확한 설명
2. 관련 문서 파일 링크 첨부
3. (추후) 테스트 결과 스크린샷 또는 로그

## 라이선스

미정 (TBD)

## 연락 / 질문

이슈 트래커 활용: 추후 Issue Template 정의 예정.

---

이 README는 인간 온보딩 중심 문서이며 AI 실행 워크플로우는 별도 프롬프트 파일로 분리되었습니다.

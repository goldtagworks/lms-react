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

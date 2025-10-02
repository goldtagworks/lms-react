<!-- Human-facing project README (AI Master Prompt moved to docs/prompts/) -->

# LMS

현대 교육 코스·시험·결제/쿠폰·수료 체계를 통합 제공하는 모듈형 학습 관리 플랫폼입니다.

> AI용 전체 구현 워크플로우(Master Prompt)는 `docs/prompts/MASTER_PROMPT_LATEST.md` 를 참조하세요.

## 📚 주요 기능 (Features)

- ✅ **시험 관리 시스템**: 완전한 CRUD 인터페이스 (Phase A,B,C 완료)
    - 시험 생성/수정/삭제
    - 다양한 문제 유형 (객관식/단답형)
    - 실시간 문제 관리 및 미리보기
- 코스 카탈로그 & 섹션 구조
- 가격(EPP 계산)
- 결제 & 쿠폰 & 웹훅 검증
- 시험(타이머/채점/쿨다운) & 수료증 발급
- RLS 기반 접근 제어
- 디자인 토큰 & 다국어(i18n) 카탈로그

## 🔧 Tech Stack

- **Frontend**: React 19 + Mantine v8 + TypeScript
- **State Management**: React Query + Zustand
- **Backend**: Supabase + Edge Functions
- **Database**: PostgreSQL + Row Level Security
- **Testing**: Playwright (E2E) + axe-core (접근성)

## 📁 디렉토리 구조

```
docs/
  000. AI 학습데이터/   # 세부 도메인 스펙
  002. 테이블 설계/     # 데이터베이스 스키마
  004. 배포/           # 배포 관련 문서
  prompts/             # AI Master Prompt 및 버전
src/
  components/          # 재사용 컴포넌트
  pages/              # 페이지 컴포넌트
    AdminExamCreatePage.tsx     # 시험 생성
    AdminExamEditPage.tsx       # 시험 수정
    AdminExamQuestionsPage.tsx  # 문제 관리
  services/           # API 서비스 계층
  hooks/              # React Query Hooks
  types/              # TypeScript 타입 정의
```

## 🚀 시작하기 (Getting Started)

### 개발 환경 설정

1. **의존성 설치**

    ```bash
    yarn install
    ```

2. **환경 변수 설정**

    ```bash
    cp .env.example .env
    # Supabase 설정 등 환경 변수 입력
    ```

3. **개발 서버 실행**
    ```bash
    yarn dev
    # http://localhost:5173 에서 접근
    ```

### 시험 관리 시스템 사용법

1. **관리자 로그인** → `/admin/exams` 접근
2. **새 시험 만들기** → 시험 정보 입력
3. **문제 추가** → 다양한 문제 유형 지원
4. **미리보기 및 수정** → 실시간 편집 가능

<!-- 테스트 스크립트는 초기 Phase C 검증 종료 후 정리됨. 필요 시 git 히스토리 참조 -->

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

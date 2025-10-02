# 시험 관리 시스템 구현 가이드

## 현재 상황 분석

### 기존 테이블 (구현됨)

- `exams`: 시험 메타데이터 (제목, 설명, 합격점수, 제한시간)
- `exam_attempts`: 시험 응시 기록
- `certificates`: 수료증 발급 기록

### 누락된 테이블 (구현 필요)

```sql
-- 시험 문제 테이블
CREATE TABLE exam_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL CHECK (question_type IN ('single', 'multiple', 'short')),
    choices jsonb, -- 객관식 선택지 (null for short answer)
    correct_answer jsonb NOT NULL, -- 정답
    points int NOT NULL DEFAULT 1, -- 배점
    order_index int NOT NULL, -- 문제 순서
    created_at timestamptz NOT NULL DEFAULT now()
);
```

## 시험 관리 권한 체계

### 현재 구현된 권한

- **관리자(admin)**: 모든 시험 생성/수정/삭제 권한
- **강사(instructor)**: 현재 권한 없음 (향후 확장 가능)
- **학생(student)**: 시험 응시만 가능

## 필요한 추가 페이지/기능

### 1. 관리자용 시험 관리 페이지

```
/admin/exams - 시험 목록
/admin/exams/new - 새 시험 생성
/admin/exams/:id/edit - 시험 수정
/admin/exams/:id/questions - 문제 관리
```

### 2. 시험 생성 플로우

1. 시험 기본 정보 입력 (제목, 설명, 합격점수, 제한시간)
2. 대상 코스 선택
3. 문제 추가/편집
    - 객관식 (단일/복수 정답)
    - 단답형
    - 배점 설정
4. 미리보기 및 발행

### 3. 문제 편집 UI

- 드래그앤드롭으로 문제 순서 변경
- 실시간 미리보기
- 문제 유형별 템플릿
- 이미지 첨부 지원 (향후)

## 구현 우선순위

### Phase 1 (즉시 필요)

- [ ] exam_questions 테이블 마이그레이션
- [ ] 관리자용 시험 목록 페이지
- [ ] 시험 생성 기본 폼

### Phase 2 (단기)

- [ ] 문제 편집 인터페이스
- [ ] 문제 미리보기
- [ ] 시험 발행/비활성화

### Phase 3 (중기)

- [ ] 문제 은행 시스템
- [ ] 시험 통계 상세 분석
- [ ] 부정행위 방지 기능

## 기술적 고려사항

### 데이터 구조

```typescript
interface ExamQuestion {
    id: string;
    examId: string;
    questionText: string;
    questionType: 'single' | 'multiple' | 'short';
    choices?: string[]; // 객관식만
    correctAnswer: string | string[]; // 타입에 따라 다름
    points: number;
    orderIndex: number;
}
```

### API 엔드포인트 필요

- GET /admin/exams - 시험 목록
- POST /admin/exams - 시험 생성
- PUT /admin/exams/:id - 시험 수정
- GET /admin/exams/:id/questions - 문제 목록
- POST /admin/exams/:id/questions - 문제 추가
- PUT /admin/questions/:id - 문제 수정
- DELETE /admin/questions/:id - 문제 삭제

### 보안 고려사항

- 시험 문제는 RLS로 관리자만 접근 가능
- 학생은 시험 응시 중에만 문제 조회 가능
- 정답은 클라이언트에 노출되면 안됨 (서버 채점)

## 다음 구현 단계

1. **exam_questions 테이블 생성** - 스키마 마이그레이션
2. **관리자 시험 목록 페이지** - /admin/exams
3. **시험 생성 폼** - /admin/exams/new
4. **문제 관리 인터페이스** - /admin/exams/:id/questions

이 시스템이 완성되면 관리자가 웹 인터페이스를 통해 시험을 생성하고 문제를 관리할 수 있습니다.

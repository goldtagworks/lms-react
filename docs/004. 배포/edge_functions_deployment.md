# Edge Functions 배포 가이드

## 현재 구현된 Edge Functions

### 1. grade-exam (시험 채점)
- **파일**: `supabase/functions/grade-exam/index.ts`
- **기능**: 시험 답안 채점 및 결과 저장
- **상태**: 구현 완료, 배포 대기

## 배포 전 체크리스트

### Environment Variables 설정
Supabase 대시보드에서 다음 환경변수 확인/설정:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 필요한 DB 테이블 확인
다음 테이블들이 올바르게 생성되어 있는지 확인:
- `exams` (시험 정보)
- `exam_questions` (시험 문제)
- `exam_attempts` (시험 응시 기록)
- `enrollments` (수강 정보)

### RLS 정책 확인
`exam_attempts` 테이블에 적절한 RLS 정책 설정 필요:
```sql
-- 본인의 시험 응시 기록만 조회 가능
CREATE POLICY "Users can view own exam attempts" ON exam_attempts
FOR SELECT USING (user_id = auth.uid());

-- 시험 응시 기록 삽입 (Edge Function용)
CREATE POLICY "Allow insert exam attempts" ON exam_attempts
FOR INSERT WITH CHECK (true);
```

## 배포 명령어

### 1. Supabase CLI 설치 및 로그인
```bash
npm install -g supabase
supabase login
```

### 2. 프로젝트 링크
```bash
cd /Users/kakaoent/melonTest/lms-react
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Edge Function 배포
```bash
# grade-exam 함수 배포
supabase functions deploy grade-exam

# 모든 함수 배포 (추후 여러 함수가 있을 때)
supabase functions deploy
```

### 4. 배포 확인
```bash
# 함수 목록 확인
supabase functions list

# 로그 확인
supabase functions logs grade-exam
```

## 테스트 절차

### 1. 로컬 테스트 (선택사항)
```bash
# 로컬에서 Edge Functions 실행
supabase start
supabase functions serve

# 다른 터미널에서 테스트
curl -X POST http://localhost:54321/functions/v1/grade-exam \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "examId": "test-exam-id",
    "answers": {"q1": "A"},
    "userId": "test-user-id",
    "enrollmentId": "test-enrollment-id"
  }'
```

### 2. 프로덕션 테스트
1. 브라우저에서 시험 페이지 접속
2. 임시 사용자로 로그인
3. 시험 응시 및 제출
4. 결과 페이지에서 점수 확인
5. Supabase 대시보드에서 `exam_attempts` 테이블 데이터 확인

## 트러블슈팅

### 함수 배포 실패
- 프로젝트 링크 상태 확인: `supabase status`
- 권한 확인: Supabase 프로젝트 Owner/Admin 권한 필요

### 함수 실행 오류
- 로그 확인: `supabase functions logs grade-exam`
- 환경변수 설정 확인
- RLS 정책 확인

### CORS 오류
- Edge Function에서 적절한 CORS 헤더 설정 확인
- OPTIONS 요청 처리 확인

## 다음 단계

배포 완료 후:
1. `enrollmentId` 실제 값으로 연동 (현재 임시값 사용)
2. 에러 처리 UI 개선
3. 수료증 발급 시스템 구현

## 관련 파일

- Frontend: 
  - `src/pages/ExamAttemptPage.tsx`
  - `src/pages/ExamResultPage.tsx`
  - `src/services/examService.ts`
- Backend:
  - `supabase/functions/grade-exam/index.ts`
- Hooks:
  - `src/hooks/useExam.ts`
  - `src/hooks/useExamQuestions.ts`
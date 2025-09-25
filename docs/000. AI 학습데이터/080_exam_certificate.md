# 080_exam_certificate — 시험·채점·수료증 규칙

본 문서는 시험 응시, 채점, 합격 판정, 수료증 발급까지의 규칙과 예외, UX 가드, 품질 기준을 정의한다.

────────────────────────────────────────────────────
## 1) 시험 규칙 (Exam Rules)

- 문항 타입: 객관식(single, multiple) 필수. 단답형(short)은 옵션.
- 시험 생성: course별 최소 1개 exam. pass_score 기본 60, 코스별 오버라이드 가능.
- 재응시: 기본 3회, 쿨다운 24시간. 정책은 exam 필드로 오버라이드 가능.
- 시간 제한: 기본 30분. 타이머 종료 시 자동 제출.
- 문항 수: 6~10개 권장. DB: exam_questions 테이블.
- 문제 표시: 셔플(true). choices 랜덤 순서.
- 제출 후: 미답안 경고 모달(남은 n개). 제출 확인 필요.

예외 처리:
- 타이머 초과 → 자동 제출.
- 탭 이탈: 3회 경고 후 자동 제출.
- 네트워크 장애 → 로컬 스토리지 임시저장, 재시도 버튼.

────────────────────────────────────────────────────
## 2) 채점 규칙 (Grading Rules)

- 채점 함수: Edge `exams/grade`.
- 로직:
  - single: answers == correct → 점수 가산.
  - multiple: 선택 세트 동일 시 정답. 부분점수 없음.
  - short: 정규식/문자열 일치 검사.
- pass = score ≥ exam.pass_score.
- idempotent: 이미 채점된 attempt는 기존 결과 반환.

응답(JSON):
    {
      "attempt_id": "uuid",
      "score": 85,
      "passed": true
    }

오류 코드:
- E_ATTEMPT_NOT_FOUND: 404
- E_NOT_OWNER: 403
- E_ALREADY_GRADED: 200 기존 결과 반환

────────────────────────────────────────────────────
## 3) 수료증 발급 규칙 (Certificate Issue)

- 조건: progress ≥ course.progress_required_percent AND passed = true.
- 함수: Edge `certificates/issue`.
- serial_no 규칙: YYYYMMDD-#### (시퀀스).
- PDF 템플릿 변수:
  - name (학생명)
  - course (강의명)
  - score (점수)
  - issued_at (발급일)
  - serial_no (일련번호)
  - issuer_name, issuer_title, org_name
- 파일명: {serial_no}_{course}_{name}.pdf
- Storage 업로드: /certs/{YYYY}/{serial_no}.pdf
- 메일 발송: 제목 "[수료증] {{name}}님, {{course}} 수료를 축하합니다"

오류 코드:
- E_NOT_PASSED: 422 합격 전 발급 시도
- E_ALREADY_ISSUED: 200 기존 레코드 반환
- E_STORAGE_FAIL: 500 업로드 실패
- E_MAIL_FAIL: 202 메일 실패, 재시도 큐

────────────────────────────────────────────────────
## 4) UX 가드

- 시험 시작 전: eligibility 검사(progress ≥ required).
- 시험 도중: 타이머 표시, 남은 시간, 문항 진행바.
- 제출 시: 미답안 개수 확인 모달.
- 합격 시: "수료증 발급 중" 배너 → 완료 후 다운로드 버튼.
- 불합격 시: "다음 응시는 24시간 후 가능" 안내.

────────────────────────────────────────────────────
## 5) 테스트 수용 기준 (AC)

- AC1: 진도 < required → ExamStartButton 비활성화.
- AC2: 타이머 만료 시 자동 제출된다.
- AC3: 시험 제출 시 미답안이 있으면 경고 모달이 표시된다.
- AC4: 합격 시 certificates 레코드가 생성되고, PDF 다운로드가 가능하다.
- AC5: 불합격 시 재응시 쿨다운 메시지가 표시된다.
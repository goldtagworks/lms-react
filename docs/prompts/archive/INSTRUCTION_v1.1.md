---
version: 1.1
stage: foundation+edge+ui+design+payment+exam
source_steps: [1,2,3,4,5,6,7]
audience: dev+ai
updated: 2025-09-26
supersedes: INSTRUCTION_v1.0.md
scope: "+Exam/Certificate/Anti-cheat"
next_release_target: v1.2
---
# Instruction v1.1 (Exam / Certificate / Anti-cheat Integrated)
> ⚠️ 이 문서는 v1.2(`INSTRUCTION_v1.2.md`)로 대체되었습니다. 최신 품질 게이트/OpenAPI/Idempotency 내용은 v1.2 참고.
> v1.0에 시험(Attempt 상태), 자동 제출(타이머/포커스), 재응시 쿨다운, 수료증 발급/멱등, 에러코드 및 테스트 AC 확장.

## 1. 시험 Attempt 상태머신
```
INIT(start)
  -> ONGOING
ONOGING (typo fix: ONGOING)
  - submit() -> SUBMITTED
  - auto_submit(timer|focus_violation|forced) -> SUBMITTED
SUBMITTED
  - grade() -> GRADED(pass|fail)
GRADED (idempotent grade repeat)
```
불변식:
- GRADED 이후 grade 재호출은 변경 금지.
- attempt.user_id != current_user → 403.
- 자동 제출 이벤트는 단 한 번만 SUBMITTED 전이를 만든다.

## 2. 수료증 발급 플로우
조건: progress ≥ required AND passed=true.
```
ELIGIBLE -> (issue) -> ISSUING -> ISSUED
```
멱등: 이미 ISSUED면 같은 serial_no + pdf_url 반환.
Serial 패턴: YYYYMMDD-#### (당일 시퀀스, zero-pad 4).

## 3. Anti-cheat 이벤트 & 로깅
| 이벤트 | 필드 | 설명 |
|--------|------|------|
| focus_violation | focus_count | 1~2회 경고, 3회 auto_submit |
| timer_expired | remaining_ms=0 | 시간 만료 자동 제출 |
| forced_terminate | operator_id | 운영자 강제 종료 |
| network_retry | retry_count | 제출 실패 후 재시도 |

로그 공통 필드:
`attempt_id, exam_id, user_id, course_id, event, focus_count?, remaining_questions, trigger, ts`

## 4. 에러/결과 코드 통합
| 코드 | 도메인 | 의미 | HTTP | UX | Idempotent |
|------|--------|------|------|----|------------|
| E_ATTEMPT_NOT_FOUND | exam | attempt 없음 | 404 | 오류 | - |
| E_NOT_OWNER | exam | 타 사용자 | 403 | 접근불가 | - |
| E_ALREADY_GRADED | exam | 재채점 호출 | 200 | 기존 점수 | Y |
| E_TIME_LIMIT_EXCEEDED | exam | 만료 후 추가 제출 | 409 | 자동 제출 안내 | - |
| E_FOCUS_VIOLATION | exam | 포커스 3회 위반 | 200 | 자동 제출 안내 | Y |
| E_RETAKE_COOLDOWN | exam | 쿨다운 진행 | 429 | 남은 시간 표시 | - |
| E_RETAKE_LIMIT | exam | 최대 횟수 초과 | 403 | 재응시 불가 | - |
| E_NOT_PASSED | cert | 불합격 발급 시도 | 422 | 합격 필요 | - |
| E_ALREADY_ISSUED | cert | 중복 발급 | 200 | 기존 다운로드 | Y |
| E_STORAGE_FAIL | cert | PDF 저장 실패 | 500 | 재시도 | - |
| E_MAIL_FAIL | cert | 메일 실패 | 202 | 발급 완료(메일만 실패) | Y |

## 5. UX 가드 규칙
| 단계 | 규칙 |
|------|------|
| 시작 버튼 | progress≥required AND attempts_left>0 AND cooldown_passed |
| 진행 중 | 타이머, 진행바, 자동 임시저장(local) |
| 제출 전 | unanswered>0 → confirm modal |
| 자동 제출 | 배너(원인: timer|focus|forced) + 즉시 grade 호출 |
| 합격 | 배너("수료증 발급 중") → 완료 시 다운로드 |
| 불합격 | 남은 시도/쿨다운 ETA 표시 |

## 6. 테스트 AC (v1.1 누적)
AC1~AC12 (v1.0 + Payment) 유지 + 아래 추가:
- AC13: 포커스 1~2회 이탈 경고만, 3회 자동 제출.
- AC14: 타이머 만료 정확히 0초에서 submit 호출 1회.
- AC15: 재응시 쿨다운 중 시작 시 E_RETAKE_COOLDOWN + 남은 시간 계산 정확.
- AC16: 재응시 횟수 초과 E_RETAKE_LIMIT.
- AC17: 합격 후 certificate.issue 멱등(두 번째 호출 기존 serial).
- AC18: 메일 실패(E_MAIL_FAIL) 시 pdf_url 존재 + 재발송 버튼.
- AC19: 자동 제출 후 grade 결과 pass/fail 일치.
- AC20: focus_violation_final 로그에 focus_count=3.

## 7. FE 유틸 제안
| 유틸 | 목적 | 핵심 Interface |
|------|------|----------------|
| useFocusViolation | 탭/visibility 감지 | { count, register(), reset() } |
| useAttemptTimer | 서버 start_ts 기준 잔여 계산 | { remainingMs, expired } |
| useAutoSaveAnswers | localStorage sync | { loadDraft(), persist() } |

## 8. DB / Infra TODO (후속)
| 항목 | 유형 | 상세 |
|------|------|------|
| audit_events | table | (id, user_id, course_id, attempt_id, event, meta, created_at) |
| certificate_serial_seq | seq | 일자별 시퀀스 (reset at day boundary) |
| attempts_index | index | exam_id+user_id+created_at DESC |
| issue_queue | worker | PDF/메일 fallback 재시도 |

## 9. i18n 키 (추가 필요)
```
exam.focusWarning
exam.autoSubmitted
exam.cooldownMessage
exam.retakeLimitReached
certificate.issuing
certificate.download
certificate.mailFailed
```

## 10. Observability 확장
메트릭:
- exam_auto_submit_total{reason}
- exam_focus_warning_total
- certificate_issue_duration_ms (p95<2000)
- certificate_issue_fail_total{type=storage|mail}

알람:
- auto_submit(reason=focus)/hour > 20 → 의심 경고
- certificate_issue_fail_total{type=storage} >0 (5분) → 장애

## 11. Definition of Done (v1.1)
| 항목 | 기준 |
|------|------|
| 자동 제출 | timer/focus/forced 단일 submit 보장 |
| 재응시 정책 | 횟수 & 쿨다운 로직 테스트 통과 |
| 수료증 | 멱등(serial 재사용) & PDF 경로 규칙 충족 |
| 로깅 | focus_violation_final, timer_expired 케이스 캡처 |
| i18n | 신규 exam/certificate 키 존재 |

## 12. 잔여 (v1.2 예정)
| 카테고리 | 계획 |
|----------|------|
| Quality Gates | a11y/mobile 자동 스캔 스크립트 |
| Coverage | 최소 statement 70% threshold 파이프라인 |
| OpenAPI | edges + exam/cert endpoints 정식 스펙 JSON |
| Gherkin | 결제/구독/쿠폰/시험 4개 시나리오 |
| Idempotency Keys | 통합 테이블 + 만료 job |

---
Instruction v1.1 끝. 다음(v1.2)에서 Quality Gates & OpenAPI/Gherkin 집중.

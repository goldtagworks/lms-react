# 결제 Edge Runbook & 인시던트 대응

> 대상: `confirm-payment` Edge Function 관련 실시간 장애 대응 절차.

---

## 1. 연락망

| 구분       | 이름/역할        | 연락 수단                 |
| ---------- | ---------------- | ------------------------- |
| 1차 Oncall | 결제 담당 개발자 | Slack #oncall-pay, 모바일 |
| 2차 백업   | 백엔드 리드      | Slack DM                  |
| 보안       | 보안 담당        | security@company          |
| PG 지원    | Toss 기술지원    | 콘솔 티켓                 |

---

## 2. 로그 조회

```bash
# 최근 100개
supabase functions logs confirm-payment --limit 100
# 에러 코드 필터 (로컬 grep 예시)
supabase functions logs confirm-payment --limit 500 | grep 'E_AMOUNT_MISMATCH'
```

로그 필드 해석:

- request_id: 프런트 → Edge 전달 추적 ID
- status: success | error
- error_code: 표준 에러 코드 (없으면 success)
- latency_ms: 함수 처리 시간

---

## 3. 공통 조사 체크리스트

| 항목                | 확인 방법                 | 비고           |
| ------------------- | ------------------------- | -------------- |
| 특정 user 다발?     | logs user_id 빈도         | 계정 문제 가능 |
| 특정 course 집중?   | course_id 빈도            | 가격 설정 오류 |
| Toss API 오류?      | error_code=TOSS_API_ERROR | 외부 의존성    |
| Latency 급증?       | latency_ms p95            | 네트워크/DB    |
| 금액 mismatch 증가? | E_AMOUNT_MISMATCH         | 가격 계산/변조 |

---

## 4. 대표 장애 Playbook

### 4.1 금액 불일치 급증

1. 로그에서 orderId 목록 수집
2. 해당 course 가격/세일/쿠폰 조합 수동 재계산
3. FE 금액 표기 vs DB list_price/sale_price 비교
4. 이상 없으면 잠정 결제 중단(버튼 disable 배너 안내) → 원인분석 후 재개

### 4.2 Toss API 5xx 다발

1. 5분 내 3회 이상 5xx 감지 시 Slack 경고
2. 재시도 로직(사용자 재시도) 안내 문구 상향
3. 장애 공지(상태 페이지 or 공지센터)
4. 회복 후 30분 모니터링 (오류율 <1%)

### 4.3 멱등 충돌 증가

1. 동일 paymentKey 재시도 많음 → 사용자 뒤로가기/새로고침 패턴
2. UX 개선: 성공 페이지 redirect 지연 여부 점검
3. confirm 결과 캐시 만료 시간 증가 고려

### 4.4 서명 위조 시도

1. E_WEBHOOK_INVALID_SIG 비율 >2%/5분
2. IP/UA 패턴 수집 → WAF / Rate limit 규칙 추가
3. WEBHOOK_SECRET 회전 (문서 020 참고)

---

## 5. 수동 조작 가이드

| 작업                   | 절차                                          | 주의                     |
| ---------------------- | --------------------------------------------- | ------------------------ |
| 잘못된 enrollment 취소 | DB: UPDATE enrollments SET status='CANCELLED' | 결제 취소와 동기화 필요  |
| 결제 강제 주입         | payments INSERT 직접 수행                     | provider_tx_id 중복 금지 |
| 로그 재수집            | logs 재조회 + 저장                            | PII 마스킹               |

---

## 6. 임시 완화 조치(Toggle)

| Toggle              | 방법                 | 영향                       |
| ------------------- | -------------------- | -------------------------- |
| 결제 버튼 비활성    | FE 전역 feature flag | 신규 결제 중단             |
| 특정 코스 판매 중지 | courses.active=false | 해당 코스만 차단           |
| Edge 함수 임시 off  | 라우팅 FE 측 guard   | 보안 리스크(직접호출 가능) |

---

## 7. SLA / SLO (초안)

| 항목           | 목표     | 측정 창 |
| -------------- | -------- | ------- |
| 결제 성공율    | >= 99%   | 월      |
| 평균 승인 시간 | < 900ms  | 일      |
| p95 승인 시간  | < 1500ms | 일      |
| 금액 불일치율  | < 0.1%   | 주      |

---

## 8. 사후 분석(Postmortem) 템플릿

```
# Incident PM-YYYYMMDD-ID

## 요약 (3문장)

## 타임라인
- 10:02 최초 경고
- 10:05 Oncall 확인
...

## 영향 범위
- 사용자 수 / 거래 수 / 금액 영향

## 근본 원인(RCA)

## 해결 조치

## 재발 방지(Action Items)
| 아이템 | 담당 | 기한 |
|--------|------|------|

## 로그/메트릭 스냅샷

## 첨부
```

---

## 9. 주기 점검 (주 1회 권장)

| 항목                     | 설명                 | 담당 |
| ------------------------ | -------------------- | ---- |
| 로그 샘플 50건 수동 검수 | 비정상 패턴 여부     |      |
| 비율 지표 검토           | 성공율/오류율        |      |
| 시그니처 회전 준비       | 다음 회전 일정 확인  |      |
| 문서 최신화              | 스키마/에러코드 반영 |      |

---

## 10. 툴/자동화 제안 (미구현)

- Latency p95 > 1500ms Slack 알람 Lambda
- E_AMOUNT_MISMATCH threshold 기반 자동 토글
- Postmortem 생성 CLI (`yarn incident:new`)

---

본 Runbook 수정 시 PR Review 2인 이상 승인 필수.

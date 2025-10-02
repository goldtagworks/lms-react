# Edge Functions 배포 가이드 (Supabase)

> 목적: 결제 승인(confirm-payment) 등 민감 로직을 클라이언트에서 제거하고 서버(Edge)에서 안전하게 수행.
> 범위: Supabase Edge Function `confirm-payment` 기준. 추후 webhook 처리, 환불(refund) 등 확장 가능.

---

## 1. 선행 체크리스트

| 구분       | 항목                                                     | 확인 |
| ---------- | -------------------------------------------------------- | ---- |
| 보안       | Service Role Key 노출 안됨 (.env, FE bundle)             |      |
| 보안       | TOSS_SECRET_KEY 클라이언트에서 제거                      |      |
| 보안       | HMAC Webhook Secret 설정 (WEBHOOK_SECRET)                |      |
| 데이터     | payments (provider, provider_tx_id) UNIQUE 제약          |      |
| 데이터     | enrollments (user_id, course_id) UNIQUE (중복 수강 방지) |      |
| 로깅       | request_id, provider_tx_id, status 로그 필드 출력        |      |
| 타임스탬프 | X-Timestamp 오차 ±300초 검증                             |      |
| 멱등성     | 동일 paymentKey + orderId 중복 처리 NO-OP                |      |
| 금액검증   | 요청 amount == Toss totalAmount                          |      |
| 통화검증   | (차후) 통화 미ismatch 시 E_CURRENCY_MISMATCH             |      |

> payments/enrollments 스키마 UNIQUE 제약 없으면 반드시 추가. (DB 마이그레이션 권장)

---

## 2. 환경 변수 구성

### Supabase Secrets (서버 전용)

```bash
supabase secrets set TOSS_SECRET_KEY=live_or_test_sk_xxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=service_role_xxx
supabase secrets set WEBHOOK_SECRET=hmac_webhook_secret_xxx
```

### 클라이언트(.env)

```bash
VITE_TOSS_CLIENT_KEY=test_ck_...
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=anon_key_xxx
VITE_BASE_URL=https://app.example.com
VITE_WEBHOOK_SECRET=<옵션: 로컬 시그니처 테스트용>
```

> 절대 FE 번들에 service_role, secret_key 포함 금지.

---

## 3. 디렉토리 구조

```
/supabase/functions/
  confirm-payment/
    index.ts         # 결제 승인 처리 (현재 구현)
  refund-payment/    # (차후) 환불 처리
```

---

## 4. 로컬 개발

```bash
# 로컬 환경변수 파일 작성
cat > supabase/functions/.env.local <<'EOF'
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_xxx
TOSS_SECRET_KEY=test_sk_xxx
WEBHOOK_SECRET=hmac_webhook_secret_xxx
EOF

# Edge Function 로컬 실행 (기본 54321)
supabase functions serve confirm-payment --env-file supabase/functions/.env.local

# 테스트 호출
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Signature: mock_signature_1234567890" \
  -H "X-Timestamp: 1234567890" \
  -d '{
    "paymentKey": "test_payment_key",
    "orderId": "order_test_123",
    "amount": 10000,
    "courseId": "course_123",
    "userId": "user_123"
  }' \
  http://localhost:54321/functions/v1/confirm-payment
```

---

## 5. 배포

```bash
# 개별 함수 배포
supabase functions deploy confirm-payment

# 전체 (변경 감지) 배포
supabase functions deploy --project-ref <project-ref>

# 배포 후 로그 확인
supabase functions logs confirm-payment
```

> 배포 URL:

```
https://<project>.supabase.co/functions/v1/confirm-payment
```

---

## 6. HMAC 시그니처 설계 (실 구현 TODO)

```text
stringToSign = timestamp + '\n' + rawBody
signature = base64( HMAC_SHA256( WEBHOOK_SECRET, stringToSign ) )

요청 헤더:
X-Timestamp: 1730400000  # epoch seconds
X-Signature: <생성된 서명>
```

검증 절차:

1. abs(now - timestamp) <= 300s
2. 재사용(signature,timestamp) 10분 내 재수신 차단 (in-memory / KV)
3. 서버에서 동일 로직 재계산 == 헤더 서명 ? 통과 : 401

---

## 7. 멱등성 전략

| 케이스                   | 키 구성                 | 처리                                      |
| ------------------------ | ----------------------- | ----------------------------------------- |
| 승인(confirm)            | paymentKey              | 이미 성공 → 200 + 기존 enrollment_id 반환 |
| 중복 Toss webhook (향후) | provider+provider_tx_id | 기존 payments row 재사용                  |

임시 구현: 메모리 캐시/스텁 → 실제: Redis / Deno KV / Supabase table(idempotency_keys)

---

## 8. 에러 코드 맵

| 코드                    | 의미                        | 액션                 | HTTP |
| ----------------------- | --------------------------- | -------------------- | ---- |
| E_WEBHOOK_INVALID_SIG   | 서명/타임스탬프 오류        | 401 반환             | 401  |
| E_AMOUNT_MISMATCH       | 금액 불일치                 | 결제 실패 처리       | 400  |
| E_PAYMENT_SAVE_FAILED   | payments upsert 실패        | 재시도/로그          | 500  |
| E_ENROLL_CREATE_FAILED  | enrollments 생성 실패       | 보상(결제 롤백 협의) | 500  |
| E_PAYMENT_UPDATE_FAILED | enrollment_id 업데이트 실패 | 로그 경고            | 200  |
| E_INTERNAL_ERROR        | 기타 서버 오류              | 모니터링             | 500  |

---

## 9. 운영 모니터링 지표

| 지표                   | 설명                    | 목표     |
| ---------------------- | ----------------------- | -------- |
| 결제 승인 성공율       | (성공 / 전체 승인 시도) | > 99%    |
| 승인 p95 latency       | Edge 함수 처리 시간     | < 1500ms |
| E_AMOUNT_MISMATCH 비율 | 금액 불일치 건수/전체   | ~0       |
| 중복 confirm 발생률    | cached 멱등 hit 비율    | < 0.5%   |

---

## 10. 추후 확장 로드맵 (문서화만, 구현 금지)

- refund-payment 함수 (수강 시작 0% + 기간 내 환불)
- coupon-validate 함수 (서버 authoritative 할인 계산)
- signed URL 기반 수료증 PDF 생성

> Copilot Instructions 규칙: "미래 계획"은 실제 구현 전 문서화만. 코드 선행 금지.

---

## 11. 프로덕션 Pre-flight 체크

```bash
# 1. UNIQUE 제약 확인 (예: psql)
\d+ payments
\d+ enrollments
# payments: UNIQUE(provider, provider_tx_id)
# enrollments: UNIQUE(user_id, course_id)

# 2. Edge secrets 재확인
supabase secrets list

# 3. 로그 샘플 점검
supabase functions logs confirm-payment --limit 20

# 4. Latency 수동 측정
for i in $(seq 1 3); do
  time curl -s -o /dev/null -w '%{http_code}\n' \
    -H "Content-Type: application/json" \
    -H "X-Signature: mock_signature_123" \
    -H "X-Timestamp: $(date +%s)" \
    -d '{"paymentKey":"t_pk_test","orderId":"o_test","amount":1,"courseId":"c1","userId":"u1"}' \
    https://<project>.supabase.co/functions/v1/confirm-payment;
  sleep 1;
done
```

---

## 12. 대표 실패 시나리오 대응

| 상황            | 징후              | 조치                                |
| --------------- | ----------------- | ----------------------------------- |
| Toss API 4xx    | TOSS_API_ERROR    | 사용자 재시도 유도 / 지원 문의 안내 |
| 금액 불일치     | E_AMOUNT_MISMATCH | 결제 중단, 내부 가격 계산 재검증    |
| enrollment 중복 | DB UNIQUE 에러    | 기존 enrollment 반환 처리 로직 추가 |
| Edge 타임아웃   | Latency 상승      | p95 모니터링, 함수 경량화           |

---

## 13. 보안 주의사항

- 절대 service role key 를 FE 번들/로그에 출력하지 말 것
- HMAC secret 회전 정책(분기 1회) 수립
- 실패 로그에 원시 Toss 응답 전체(raw) 노출하지 않고 필요한 필드만 저장 고려

---

## 14. 체크리스트 (최종)

- [ ] secrets 설정 완료
- [ ] UNIQUE 제약 확인
- [ ] 첫 실거래 전 sandbox 거래 3건 승인/실패 시뮬레이션
- [ ] p95 latency < 1500ms 측정
- [ ] 로깅 필드(request_id, provider_tx_id 등) Kibana/Log UI에서 검색 가능
- [ ] 결제 취소(환불) 정책 문서 링크화

---

문의/수정 필요 시 본 파일 PR로 이력 남길 것.

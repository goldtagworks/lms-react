# Supabase Edge Functions Configuration

## 환경 변수 설정

Edge Function 배포 전에 다음 환경 변수를 설정해야 합니다:

### Supabase CLI를 통한 시크릿 설정

```bash
# Toss Payments Secret Key (서버용)
supabase secrets set TOSS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R

# Supabase Service Role Key (DB 접근용)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Webhook 서명 검증용 Secret
supabase secrets set WEBHOOK_SECRET=your-webhook-secret-key
```

### 로컬 개발용 .env.local

```bash
# supabase/functions/.env.local 파일 생성
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TOSS_SECRET_KEY=test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R
WEBHOOK_SECRET=your-webhook-secret-key
```

## 배포 명령어

```bash
# Edge Function 배포
supabase functions deploy confirm-payment

# 로컬 테스트
supabase functions serve confirm-payment --env-file supabase/functions/.env.local
```

## 보안 고려사항

1. **서명 검증**: 클라이언트에서 보내는 모든 요청은 HMAC-SHA256 서명으로 검증
2. **타임스탬프 검증**: 요청 시간이 5분 이내인지 확인
3. **멱등성**: 동일한 결제 키로 중복 처리 방지
4. **금액 검증**: Toss API 응답과 클라이언트 요청 금액 일치 확인

## 테스트

```bash
# Edge Function 테스트 호출
curl -X POST https://your-project.supabase.co/functions/v1/confirm-payment \
  -H "Content-Type: application/json" \
  -H "X-Signature: mock_signature_1234567890" \
  -H "X-Timestamp: 1234567890" \
  -d '{
    "paymentKey": "test_payment_key",
    "orderId": "order_test_123",
    "amount": 10000,
    "courseId": "course_123",
    "userId": "user_123"
  }'
```

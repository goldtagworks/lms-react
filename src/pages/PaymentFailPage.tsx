import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Title, Text, Button, Stack, Alert } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';
import { tossPaymentService } from '@main/services/tossPaymentService';
import { t } from '@main/lib/i18n';

interface PaymentFailPageProps {}

const PaymentFailPage = (_: PaymentFailPageProps) => {
    // Toss 실패 콜백: /payment/fail?code=... or errorCode=..., message=... or errorMessage=...
    const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const code = search.get('code') || search.get('errorCode') || undefined;
    const message = search.get('message') || search.get('errorMessage') || undefined;
    const navigate = useNavigate();
    const [hasCleanedUp, setHasCleanedUp] = useState(false);

    useEffect(() => {
        // URL에서 orderId 추출하여 정리
        const orderId = search.get('orderId');

        if (orderId && !hasCleanedUp) {
            tossPaymentService.handlePaymentFail(orderId, code || 'UNKNOWN', message || 'Unknown error');
            setHasCleanedUp(true);
        }
    }, [code, message, hasCleanedUp, search]);

    const getErrorMessage = () => {
        switch (code) {
            case 'PAY_PROCESS_CANCELED':
                return t('payment.error.userCanceled');
            case 'PAY_PROCESS_ABORTED':
                return t('payment.error.processAborted');
            case 'REJECT_CARD_COMPANY':
                return t('payment.error.cardRejected');
            case 'INVALID_CARD_EXPIRATION':
                return t('payment.error.invalidCardExpiration');
            case 'INSUFFICIENT_CARDS_FUND':
                return t('payment.error.insufficientFunds');
            case 'NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT':
                return t('payment.error.installmentNotSupported');
            default:
                return message || t('payment.error.unknown');
        }
    };

    const handleRetryPayment = () => {
        navigate(-1); // 이전 페이지(결제 페이지)로 돌아가기
    };

    const handleGoToCourses = () => {
        navigate('/courses');
    };

    return (
        <PageContainer>
            <Card withBorder padding="xl" radius="md" style={{ maxWidth: 600, margin: '0 auto' }}>
                <Stack align="center" gap="lg">
                    {/* 실패 아이콘 */}
                    <div
                        style={{
                            backgroundColor: 'var(--mantine-color-red-light)',
                            borderRadius: '50%',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ✕
                    </div>

                    {/* 실패 메시지 */}
                    <Stack align="center" gap="xs">
                        <Title c="red" order={2}>
                            {t('payment.fail.title')}
                        </Title>
                        <Text c="dimmed" size="lg" ta="center">
                            {t('payment.fail.message')}
                        </Text>
                    </Stack>

                    {/* 에러 세부 정보 */}
                    <Alert color="red" title={t('payment.error.details')} w="100%">
                        <Stack gap="xs">
                            {code && (
                                <Text size="sm">
                                    <strong>{t('payment.error.code')}:</strong> {code}
                                </Text>
                            )}
                            <Text size="sm">
                                <strong>{t('payment.error.reason')}:</strong> {getErrorMessage()}
                            </Text>
                        </Stack>
                    </Alert>

                    {/* 액션 버튼 */}
                    <Stack gap="sm" w="100%">
                        <Button fullWidth size="md" onClick={handleRetryPayment}>
                            {t('payment.fail.retry')}
                        </Button>
                        <Button fullWidth size="md" variant="outline" onClick={handleGoToCourses}>
                            {t('common.backToCourses')}
                        </Button>
                    </Stack>

                    {/* 추가 안내 */}
                    <Text c="dimmed" size="sm" ta="center">
                        {t('payment.fail.additionalInfo')}
                    </Text>
                </Stack>
            </Card>
        </PageContainer>
    );
};

export default PaymentFailPage;

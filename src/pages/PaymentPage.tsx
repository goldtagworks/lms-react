/**
 * [schema-sync] Toss Payments 연동 결제 페이지
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Title, Text, Button, Group, Stack, Alert, Loader, Divider } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';
import { useAuth } from '@main/lib/auth';
import { useCourse } from '@main/lib/repository';
import { calculateEPP, formatPrice, calculateDiscountPercent } from '@main/features/payments/epp';
import { tossPaymentService } from '@main/services/tossPaymentService';
import { t } from '@main/lib/i18n';

export default function PaymentPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const course = useCourse(courseId);

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        // AuthAny 가드에 의해 로그인이 보장되므로 user는 항상 존재

        // 무료 강의는 즉시 수강신청
        if (course && course.price_cents === 0) {
            navigate(`/enroll/${courseId}`);

            return;
        }
    }, [user, course, courseId, navigate]);

    if (!user || !course) {
        return (
            <PageContainer roleMain py={48}>
                <Loader />
            </PageContainer>
        );
    }

    // EPP 계산 (서버 계산 값)
    const epp = calculateEPP({
        price_cents: course.price_cents,
        sale_price_cents: course.sale_price_cents || null,
        sale_ends_at: course.sale_ends_at || null,
        currency: course.currency_code,
        tax_included: course.tax_included
    });

    const discountPercent = calculateDiscountPercent(epp.original_price_cents, epp.final_amount_cents);

    const handlePayment = async () => {
        if (isProcessing) return;

        setIsProcessing(true);
        setError('');

        try {
            const paymentFlow = await tossPaymentService.requestPayment({
                course: {
                    id: course.id,
                    title: course.title
                },
                user: {
                    id: user.id,
                    name: user.name || user.email?.split('@')[0],
                    email: user.email
                },
                epp
            });

            if (paymentFlow.step === 'FAILED') {
                setError(paymentFlow.error?.message || t('payment.error.unknown'));
            }
        } catch (err: any) {
            setError(err.message || t('payment.error.request'));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <PageContainer roleMain py={48}>
            <Card withBorder p="xl" radius="lg" shadow="sm" style={{ maxWidth: 500, margin: '0 auto' }}>
                <Stack gap="lg">
                    <div>
                        <Title order={2}>{t('payment.title')}</Title>
                        <Text c="dimmed" size="sm">
                            {t('payment.subtitle')}
                        </Text>
                    </div>

                    {/* 강의 정보 */}
                    <div>
                        <Text fw={600} size="lg">
                            {course.title}
                        </Text>
                        <Text c="dimmed" size="sm">
                            {course.description}
                        </Text>
                    </div>

                    <Divider />

                    {/* 가격 정보 */}
                    <Stack gap="xs">
                        <Group justify="space-between">
                            <Text>{t('payment.originalPrice')}</Text>
                            <Text c={epp.discount_amount_cents > 0 ? 'dimmed' : undefined} td={epp.discount_amount_cents > 0 ? 'line-through' : undefined}>
                                {formatPrice(epp.original_price_cents, epp.currency)}
                            </Text>
                        </Group>

                        {epp.discount_amount_cents > 0 && (
                            <>
                                <Group justify="space-between">
                                    <Text>{t('payment.discount')}</Text>
                                    <Text c="red">
                                        -{formatPrice(epp.discount_amount_cents, epp.currency)} ({discountPercent}%)
                                    </Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text>{t('payment.salePrice')}</Text>
                                    <Text c="blue">{formatPrice(epp.effective_price_cents, epp.currency)}</Text>
                                </Group>
                            </>
                        )}

                        {epp.tax_amount_cents > 0 && (
                            <Group justify="space-between">
                                <Text c="dimmed" size="sm">
                                    {t('payment.tax')}
                                </Text>
                                <Text c="dimmed" size="sm">
                                    {formatPrice(epp.tax_amount_cents, epp.currency)}
                                </Text>
                            </Group>
                        )}

                        <Divider />

                        <Group justify="space-between">
                            <Text fw={700} size="lg">
                                {t('payment.finalAmount')}
                            </Text>
                            <Text c="blue" fw={700} size="lg">
                                {formatPrice(epp.final_amount_cents, epp.currency)}
                            </Text>
                        </Group>
                    </Stack>

                    {error && <Alert color="red">{error}</Alert>}

                    {/* 결제 버튼 */}
                    <Group grow>
                        <Button disabled={isProcessing} radius="md" size="sm" variant="outline" onClick={() => navigate(-1)}>
                            {t('common.cancel')}
                        </Button>
                        <Button loading={isProcessing} radius="md" size="sm" onClick={handlePayment}>
                            {t('payment.pay')} {formatPrice(epp.final_amount_cents, epp.currency)}
                        </Button>
                    </Group>

                    <Text c="dimmed" size="xs" ta="center">
                        {t('payment.secureNote')}
                    </Text>
                </Stack>
            </Card>
        </PageContainer>
    );
}

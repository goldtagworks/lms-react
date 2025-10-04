import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Title, Text, Button, Stack, Alert, Loader, Center } from '@mantine/core';
import AuthLayout from '@main/components/auth/AuthLayout';
import PaymentHero from '@main/components/payment/PaymentHero';
import { tossPaymentService } from '@main/services/tossPaymentService';
import { t } from '@main/lib/i18n';
import { useCourse } from '@main/lib/repository';

interface PaymentSuccessPageProps {}

const PaymentSuccessPage = (_: PaymentSuccessPageProps) => {
    // Toss 콜백은 /payment/success?paymentKey=xxx&orderId=...&amount=... 형태
    const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const paymentKey = search.get('paymentKey') || undefined;
    const navigate = useNavigate();
    const [isConfirming, setIsConfirming] = useState(true);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [courseId, setCourseId] = useState<string | null>(null);

    // Course 정보 조회 (courseId가 있을 때만)
    const course = useCourse(courseId || undefined);

    useEffect(() => {
        if (!paymentKey) {
            setError(t('payment.error.missingPaymentKey'));
            setIsConfirming(false);

            return;
        }

        const confirmPayment = async () => {
            try {
                // URLSearchParams에서 orderId와 amount 가져오기
                const orderId = search.get('orderId');
                const amount = search.get('amount');

                if (!orderId || !amount) {
                    throw new Error(t('payment.error.missingParameters'));
                }

                // 로컬 스토리지에서 결제 정보 복원
                const storedData = localStorage.getItem(`payment_${orderId}`);

                if (!storedData) {
                    throw new Error(t('payment.error.orderNotFound'));
                }

                const paymentFlow = JSON.parse(storedData);

                setCourseId(paymentFlow.course.id);

                // Toss 결제 승인 및 DB 처리
                const success = await tossPaymentService.handlePaymentSuccess(paymentKey, orderId, parseInt(amount));

                if (success) {
                    setIsConfirmed(true);
                } else {
                    throw new Error(t('payment.error.confirmationFailed'));
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn('[PaymentSuccess] confirmation failed', err);
                setError(err instanceof Error ? err.message : t('payment.error.confirmationFailed'));
            } finally {
                setIsConfirming(false);
            }
        };

        confirmPayment();
    }, [paymentKey]);

    const handleGoToCourse = () => {
        if (courseId) {
            navigate(`/courses/${courseId}`);
        }
    };

    const handleGoToMyCourses = () => {
        navigate('/my-courses');
    };

    if (isConfirming) {
        return (
            <AuthLayout hero={<PaymentHero variant="success" />}>
                <Center style={{ minHeight: '400px' }}>
                    <Stack align="center" gap="md">
                        <Loader size="lg" />
                        <Text size="lg">{t('payment.confirming')}</Text>
                        <Text c="dimmed" size="sm">
                            {t('payment.confirmingMessage')}
                        </Text>
                    </Stack>
                </Center>
            </AuthLayout>
        );
    }

    if (error) {
        return (
            <AuthLayout hero={<PaymentHero variant="success" />}>
                <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md" style={{ maxWidth: 600, margin: '0 auto' }}>
                    <Stack align="center" gap="md">
                        <Alert color="red" radius="md" title={t('payment.error.title')} w="100%">
                            {error}
                        </Alert>
                        <Button fullWidth radius="md" size="sm" variant="outline" onClick={() => navigate('/courses')}>
                            {t('common.backToCourses')}
                        </Button>
                    </Stack>
                </Card>
            </AuthLayout>
        );
    }

    if (isConfirmed) {
        return (
            <AuthLayout hero={<PaymentHero variant="success" />}>
                <Card withBorder p={{ base: 'lg', md: 'xl' }} radius="lg" shadow="md" style={{ maxWidth: 600, margin: '0 auto' }}>
                    <Stack align="center" gap="lg">
                        <div
                            style={{
                                backgroundColor: 'var(--mantine-color-green-light)',
                                borderRadius: '50%',
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ✓
                        </div>
                        <Stack align="center" gap="xs">
                            <Title c="green" order={2}>
                                {t('payment.success.title')}
                            </Title>
                            <Text size="lg" ta="center">
                                {t('payment.success.message')}
                            </Text>
                        </Stack>
                        {course && (
                            <Card bg="gray.0" p={{ base: 'lg', md: 'xl' }} radius="sm" shadow="md" w="100%">
                                <Stack gap="xs">
                                    <Text c="dimmed" fw={600} size="sm">
                                        {t('payment.success.enrolledCourse')}
                                    </Text>
                                    <Text fw={500} size="lg">
                                        {course.title}
                                    </Text>
                                    <Text c="dimmed" size="sm">
                                        {t('course.instructor')}: {course.instructor_id}
                                    </Text>
                                </Stack>
                            </Card>
                        )}
                        <Stack gap="sm" w="100%">
                            {courseId && (
                                <Button fullWidth radius="md" size="sm" onClick={handleGoToCourse}>
                                    {t('payment.success.startLearning')}
                                </Button>
                            )}
                            <Button fullWidth radius="md" size="sm" variant="outline" onClick={handleGoToMyCourses}>
                                {t('payment.success.goToMyCourses')}
                            </Button>
                        </Stack>
                        <Text c="dimmed" size="sm" ta="center">
                            {t('payment.success.additionalInfo')}
                        </Text>
                    </Stack>
                </Card>
            </AuthLayout>
        );
    }

    return null;
};

export default PaymentSuccessPage;

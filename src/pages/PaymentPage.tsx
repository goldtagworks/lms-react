import { Button, Card, Stack, Text, Title } from '@mantine/core';
import { CreditCard, BookOpen } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import { getCourse } from '@main/lib/repository';
import PriceText from '@main/components/price/PriceText';
import EmptyState from '@main/components/EmptyState';

const PaymentPage = () => {
    const { id: rawId } = useParams();
    const mappedId = !rawId ? undefined : rawId.startsWith('c') ? rawId : 'c' + rawId;
    const course = mappedId ? getCourse(mappedId) : undefined;

    if (!course) {
        return (
            <PageContainer roleMain size="sm">
                <Title mb="sm" order={2}>
                    결제
                </Title>
                <EmptyState actionLabel="코스 목록" message="이미 삭제되었거나 주소가 올바르지 않습니다." title="코스를 찾을 수 없어요" to="/courses" />
            </PageContainer>
        );
    }

    // 결제자/상태는 아직 도메인 미구현 → 임시 상수
    const purchaser = '홍길동(샘플)';
    const status = '대기';

    return (
        <PageContainer roleMain size="sm">
            <Card withBorder p="xl" radius="md" shadow="sm">
                <Stack>
                    <Title order={2}>결제</Title>
                    <Text fw={700} size="lg">
                        {course.title}
                    </Text>
                    <PriceText discount={course.sale_price_cents ?? undefined} price={course.list_price_cents} size="md" />
                    <Text size="sm">결제자: {purchaser}</Text>
                    <Text c="dimmed" size="sm">
                        상태: {status}
                    </Text>
                    <Button color="blue" component={Link} leftSection={<CreditCard size={16} />} size="md" to={`/exam/${course.id}`} variant="filled">
                        결제 진행 (시험 응시 예시)
                    </Button>
                    <Button component={Link} leftSection={<BookOpen size={16} />} size="md" to={`/enroll/${course.id}`} variant="outline">
                        수강신청 화면으로
                    </Button>
                </Stack>
            </Card>
        </PageContainer>
    );
};

export default PaymentPage;

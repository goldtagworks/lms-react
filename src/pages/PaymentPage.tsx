import { Button, Card, Container, Stack, Text, Title } from '@mantine/core';
import { useParams, Link } from 'react-router-dom';

const mockPayment = {
    id: 1,
    courseTitle: 'React 입문',
    amount: 39000,
    user: '홍길동',
    status: '대기'
};

const PaymentPage = () => {
    const { id } = useParams();

    // 실제로는 id로 데이터 fetch, 여기선 mock만 사용
    return (
        <Container py="xl" size="sm">
            <Card withBorder padding="xl" radius="md" shadow="sm">
                <Stack>
                    <Title order={2}>결제</Title>
                    <Text fw={700}>{mockPayment.courseTitle}</Text>
                    <Text>결제자: {mockPayment.user}</Text>
                    <Text>결제금액: {mockPayment.amount.toLocaleString()}원</Text>
                    <Text c="dimmed">상태: {mockPayment.status}</Text>
                    <Button color="primary" component={Link} size="md" to={`/exam/${mockPayment.id}`} variant="filled">
                        결제 완료(시험 응시로 이동)
                    </Button>
                    <Button component={Link} size="md" to={`/enroll/${mockPayment.id}`} variant="outline">
                        수강신청 화면으로
                    </Button>
                </Stack>
            </Card>
        </Container>
    );
};

export default PaymentPage;

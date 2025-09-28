import { Button, Card, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';

const mockExam = {
    id: 1,
    courseTitle: 'React 입문',
    user: '홍길동',
    status: '응시 전',
    score: null
};

const ExamPage = () => {
    // 실제로는 id로 데이터 fetch, 여기선 mock만 사용
    return (
        <PageContainer roleMain py={48} size="sm">
            <Card withBorder padding="xl" radius="md" shadow="sm">
                <Stack>
                    <Title order={2}>시험 응시</Title>
                    <Text fw={700}>{mockExam.courseTitle}</Text>
                    <Text>응시자: {mockExam.user}</Text>
                    <Text c="dimmed">상태: {mockExam.status}</Text>
                    <Button color="primary" component={Link} size="sm" to={`/certificate/1`} variant="filled">
                        시험 완료(수료증 보기)
                    </Button>
                    <Button component={Link} size="sm" to={`/my`} variant="outline">
                        마이페이지로
                    </Button>
                </Stack>
            </Card>
        </PageContainer>
    );
};

export default ExamPage;

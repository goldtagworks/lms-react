import { Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import { useParams, Link } from 'react-router-dom';

const mockCourse = {
    id: 1,
    title: 'React 입문',
    instructor: '홍길동',
    price: 39000,
    summary: 'React 기초부터 실전까지!'
};

export default function CourseDetailPage() {
    const { id } = useParams();

    // 실제로는 id로 데이터 fetch, 여기선 mock만 사용
    return (
        <Container py="xl" size="sm">
            <Card withBorder padding="xl" radius="md" shadow="sm">
                <Stack>
                    <Title order={2}>{mockCourse.title}</Title>
                    <Text c="dimmed">강사: {mockCourse.instructor}</Text>
                    <Text>{mockCourse.summary}</Text>
                    <Text fw={700}>{mockCourse.price.toLocaleString()}원</Text>
                    <Group gap="md">
                        <Button component={Link} size="md" to={`/enroll/${mockCourse.id}`} variant="filled">
                            수강신청
                        </Button>
                        <Button component={Link} size="md" to="/courses" variant="outline">
                            목록으로
                        </Button>
                    </Group>
                </Stack>
            </Card>
        </Container>
    );
}

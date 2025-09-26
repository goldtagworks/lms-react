import { Card, Container, Grid, Text, Title, Button } from '@mantine/core';
import { Link } from 'react-router-dom';

const mockCourses = [
    { id: 1, title: 'React 입문', instructor: '홍길동', price: 39000, summary: 'React 기초부터 실전까지!' },
    { id: 2, title: 'TypeScript 완전정복', instructor: '이몽룡', price: 45000, summary: 'TS 타입 시스템 마스터' },
    { id: 3, title: 'SQL & 데이터베이스', instructor: '성춘향', price: 32000, summary: 'DB 기초와 실무 활용' }
];

const CourseListPage = () => {
    return (
        <Container py="xl" size="lg">
            <Title mb="lg" order={2}>
                전체 코스
            </Title>
            <Grid>
                {mockCourses.map((course) => (
                    <Grid.Col key={course.id} span={{ base: 12, sm: 6, md: 4 }}>
                        <Card withBorder padding="lg" radius="md" shadow="sm">
                            <Title order={4}>{course.title}</Title>
                            <Text c="dimmed" size="sm">
                                강사: {course.instructor}
                            </Text>
                            <Text my="sm">{course.summary}</Text>
                            <Text fw={700}>{course.price.toLocaleString()}원</Text>
                            <Button fullWidth component={Link} mt="sm" to={`/course/${course.id}`} variant="light">
                                상세 보기
                            </Button>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>
        </Container>
    );
};

export default CourseListPage;

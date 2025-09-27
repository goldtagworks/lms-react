import { Container, Title, Text, Button, Group, Stack, Card } from '@mantine/core';
import { Link } from 'react-router-dom';
import { loadCourses } from '@main/lib/repository';

const InstructorCoursesPage = () => {
    const courses = loadCourses();

    return (
        <Container py="xl">
            <Group justify="space-between" mb="lg">
                <Title order={2}>강의 관리</Title>
                <Button component={Link} size="xs" to="/instructor/courses/new" variant="light">
                    새 강의 만들기
                </Button>
            </Group>
            <Text c="dimmed" mb="md" size="sm">
                내가 개설한 강의 목록 (목업)
            </Text>
            <Stack gap="sm">
                {courses.map((c) => (
                    <Card key={c.id} withBorder component={Link} radius="md" shadow="xs" to={`/course/${c.id}`}>
                        <Group justify="space-between">
                            <Text fw={600}>{c.title}</Text>
                            <Button component={Link} size="xs" to={`/instructor/courses/${c.id}/edit`} variant="subtle">
                                수정
                            </Button>
                        </Group>
                    </Card>
                ))}
            </Stack>
        </Container>
    );
};

export default InstructorCoursesPage;

import { Title, Text, Button, Group, Stack, Card } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loadCoursesPaged } from '@main/lib/repository';
import PaginationBar from '@main/components/PaginationBar';
import PageContainer from '@main/components/layout/PageContainer';

const InstructorCoursesPage = () => {
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);
    const { items: pagedCourses, total, totalPages } = loadCoursesPaged(page, PAGE_SIZE);

    // page가 범위를 벗어나면 보정
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    return (
        <PageContainer roleMain py={48}>
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
                {pagedCourses.map((c) => (
                    <Card key={c.id} withBorder radius="md" shadow="xs">
                        <Group justify="space-between">
                            <Text component={Link} fw={600} style={{ textDecoration: 'none' }} to={`/course/${c.id}`}>
                                {c.title}
                            </Text>
                            <Button component={Link} size="xs" to={`/instructor/courses/${c.id}/edit`} variant="subtle">
                                수정
                            </Button>
                        </Group>
                    </Card>
                ))}
                {total === 0 && (
                    <Text c="dimmed" size="sm">
                        강의가 없습니다.
                    </Text>
                )}
            </Stack>
            <PaginationBar align="right" page={page} totalPages={totalPages} onChange={setPage} />
        </PageContainer>
    );
};

export default InstructorCoursesPage;

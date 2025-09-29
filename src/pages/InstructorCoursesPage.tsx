import { Title, Text, Button, Group, Card, Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Eye, Edit } from 'lucide-react';
import { loadCoursesPaged } from '@main/lib/repository';
import PaginationBar from '@main/components/PaginationBar';
import PageContainer from '@main/components/layout/PageContainer';
import CourseGrid from '@main/components/layout/CourseGrid';
import AppImage from '@main/components/AppImage';
import PriceText from '@main/components/price/PriceText';
import { TagChip } from '@main/components/TagChip';

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
                <Button component={Link} size="sm" to="/instructor/courses/new" variant="light">
                    새 강의 만들기
                </Button>
            </Group>
            <Text c="dimmed" mb="md" size="sm">
                내가 개설한 강의 목록
            </Text>
            {total === 0 && (
                <Text c="dimmed" size="sm">
                    강의가 없습니다.
                </Text>
            )}
            {total > 0 && (
                <CourseGrid mt="md">
                    {pagedCourses.map((c) => (
                        <Card key={c.id} withBorder p="lg" radius="md" shadow="sm">
                            <AppImage alt={c.title} height={120} mb={12} radius="lg" src={c.thumbnail_url || ''} />
                            <Group align="center" justify="space-between" mb={4} wrap="nowrap">
                                <Text fw={600} lineClamp={1} size="sm">
                                    {c.title}
                                </Text>
                                {c.is_featured && (
                                    <Badge color="teal" size="xs" variant="light">
                                        추천
                                    </Badge>
                                )}
                            </Group>
                            <Group gap={4} mb={4}>
                                {c.tags?.slice(0, 4).map((tag) => (
                                    <TagChip key={tag} label={tag} />
                                ))}
                            </Group>
                            {c.summary && (
                                <Text c="dimmed" lineClamp={2} mb={6} size="sm">
                                    {c.summary}
                                </Text>
                            )}
                            <PriceText discount={c.sale_price_cents ?? undefined} price={c.list_price_cents} size="sm" />
                            <Group grow gap={8} mt="sm">
                                <Button component={Link} leftSection={<Eye size={14} />} radius="md" size="sm" to={`/course/${c.id}`} variant="filled">
                                    보기
                                </Button>
                                <Button component={Link} leftSection={<Edit size={14} />} radius="md" size="sm" to={`/instructor/courses/${c.id}/edit`} variant="outline">
                                    수정
                                </Button>
                            </Group>
                        </Card>
                    ))}
                </CourseGrid>
            )}
            <PaginationBar align="right" page={page} totalPages={totalPages} onChange={setPage} />
        </PageContainer>
    );
};

export default InstructorCoursesPage;

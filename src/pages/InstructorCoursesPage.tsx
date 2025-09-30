import { Title, Text, Button, Group, Card, Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Eye, Edit } from 'lucide-react';
import { t } from '@main/lib/i18n';
import PaginationBar from '@main/components/PaginationBar';
import PageContainer from '@main/components/layout/PageContainer';
import CourseGrid from '@main/components/layout/CourseGrid';
import AppImage from '@main/components/AppImage';
import PriceText from '@main/components/price/PriceText';
import { TagChip } from '@main/components/TagChip';
import useInstructorCoursesPaged from '@main/hooks/instructor/useInstructorCoursesPaged';

const InstructorCoursesPage = () => {
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);
    const { data } = useInstructorCoursesPaged(page, { pageSize: PAGE_SIZE });

    // page가 범위를 벗어나면 보정
    useEffect(() => {
        if (data && page > data.pageCount) setPage(data.pageCount);
    }, [page, data]);

    return (
        <PageContainer roleMain py={48}>
            <Group justify="space-between" mb="lg">
                <Title order={2}>{t('instructor.courses.title')}</Title>
                <Button component={Link} size="sm" to="/instructor/courses/new" variant="light">
                    {t('instructor.courses.new')}
                </Button>
            </Group>
            <Text c="dimmed" mb="md" size="sm">
                {t('instructor.courses.subtitle')}
            </Text>
            {data.total === 0 && (
                <Text c="dimmed" size="sm">
                    {t('instructor.courses.empty')}
                </Text>
            )}
            {data.total > 0 && (
                <CourseGrid mt="md">
                    {data.items.map((c: any) => (
                        <Card key={c.id} withBorder p="lg" radius="md" shadow="sm">
                            <AppImage alt={c.title} height={120} mb={12} radius="lg" src={c.thumbnail_url || ''} />
                            <Group align="center" justify="space-between" mb={4} wrap="nowrap">
                                <Text fw={600} lineClamp={1} size="sm">
                                    {c.title}
                                </Text>
                                {c.is_featured && (
                                    <Badge color="teal" size="xs" variant="light">
                                        {t('instructor.courses.featured')}
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
                                    {t('common.view')}
                                </Button>
                                <Button component={Link} leftSection={<Edit size={14} />} radius="md" size="sm" to={`/instructor/courses/${c.id}/edit`} variant="outline">
                                    {t('common.edit')}
                                </Button>
                            </Group>
                        </Card>
                    ))}
                </CourseGrid>
            )}
            <PaginationBar align="right" page={page} totalPages={data.pageCount} onChange={setPage} />
        </PageContainer>
    );
};

export default InstructorCoursesPage;

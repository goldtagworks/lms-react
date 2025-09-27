import { Card, Text, Button, Group, Select, TextInput, Badge } from '@mantine/core';
import { Eye } from 'lucide-react';
import { useState, useMemo } from 'react';
import { TagChip } from '@main/components/TagChip';
import { Link } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PageSection from '@main/components/layout/PageSection';
import CourseGrid from '@main/components/layout/CourseGrid';
import AppImage from '@main/components/AppImage';
import PriceText from '@main/components/price/PriceText';
import { useCourses, enrollAndNotify, isEnrolled, isWishlisted, toggleWishlistAndNotify } from '@main/lib/repository';
import EnrollWishlistActions from '@main/components/EnrollWishlistActions';
import EmptyState from '@main/components/EmptyState';
import { useAuth } from '@main/lib/auth';

const categories = [
    { value: 'all', label: '전체' },
    { value: 'frontend', label: '프론트엔드' },
    { value: 'backend', label: '백엔드' },
    { value: 'data', label: '데이터분석' },
    { value: 'ai', label: 'AI/ML' },
    { value: 'cert', label: '자격증' },
    { value: 'biz', label: '비즈니스' }
];

// 기존 mock 제거 → repository seed 사용

const CourseListPage = () => {
    const courses = useCourses();
    const { user } = useAuth();
    const userId = user?.id;
    const [category, setCategory] = useState<string>('all');
    const [query, setQuery] = useState<string>('');

    const filtered = useMemo(() => {
        const base = courses.filter((c) => {
            if (category !== 'all' && c.category !== category) return false;
            if (query.trim()) {
                const q = query.trim().toLowerCase();
                const inTitle = c.title.toLowerCase().includes(q);
                const inSummary = (c.summary || '').toLowerCase().includes(q);
                const inTags = (c.tags || []).some((t) => t.toLowerCase().includes(q));

                if (!inTitle && !inSummary && !inTags) return false;
            }

            return true;
        });

        return base.slice().sort((a, b) => {
            // featured 먼저, rank 오름차순
            const af = a.is_featured ? 1 : 0;
            const bf = b.is_featured ? 1 : 0;

            if (af !== bf) return bf - af; // true 먼저

            if (a.is_featured && b.is_featured) {
                const ar = a.featured_rank ?? 999;
                const br = b.featured_rank ?? 999;

                if (ar !== br) return ar - br;
            }

            return 0;
        });
    }, [courses, category, query]);

    const handleEnroll = (courseId: string, enrolled: boolean) => {
        if (!userId || enrolled) return;
        enrollAndNotify(userId, courseId);
    };

    const handleWishlist = (courseId: string) => {
        if (!userId) return;
        toggleWishlistAndNotify(userId, courseId);
    };

    const handleResetFilters = () => {
        setCategory('all');
        setQuery('');
    };

    return (
        <PageContainer roleMain>
            <PageHeader description="카테고리/정렬/검색을 활용해 원하는 강의를 찾아보세요." title="전체 강의" />
            <PageSection withGapTop={false}>
                {/* 필터/정렬/검색 UI */}
                <Group gap="md" mb="xl" wrap="wrap">
                    <Select aria-label="카테고리" data={categories} defaultValue="all" size="md" value={category} onChange={(v) => setCategory(v || 'all')} />
                    <Select
                        aria-label="정렬"
                        data={[
                            { value: 'latest', label: '최신순' },
                            { value: 'popular', label: '인기순' },
                            { value: 'rating', label: '평점순' }
                        ]}
                        defaultValue="latest"
                        size="md"
                    />
                    <TextInput aria-label="검색" miw={220} placeholder="강의명/키워드 검색" size="md" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
                    <Button disabled size="md" variant="outline">
                        정렬(스텁)
                    </Button>
                </Group>
                <CourseGrid>
                    {filtered.map((course) => {
                        const enrolled = userId ? isEnrolled(userId, course.id) : false;
                        const wish = userId ? isWishlisted(userId, course.id) : false;

                        return (
                            <Card key={course.id} withBorder p="lg" radius="md" shadow="sm">
                                <AppImage alt={course.title} height={140} mb={12} radius="lg" src={course.thumbnail_url || ''} />
                                <Group align="center" justify="space-between" mb={4} wrap="nowrap">
                                    <Text fw={700} size="md">
                                        {course.title}
                                    </Text>
                                    <Group gap={4}>
                                        {enrolled && (
                                            <Badge color="green" size="xs">
                                                수강중
                                            </Badge>
                                        )}
                                        {wish && (
                                            <Badge color="pink" size="xs">
                                                위시
                                            </Badge>
                                        )}
                                    </Group>
                                </Group>
                                <Group gap={4} mb={4}>
                                    {course.is_featured && (
                                        <Badge color="teal" size="xs" variant="filled">
                                            {course.featured_badge_text || '추천'}
                                        </Badge>
                                    )}
                                    {course.tags?.map((tag) => (
                                        <TagChip key={tag} label={tag} />
                                    ))}
                                </Group>
                                {course.summary && (
                                    <Text c="dimmed" lineClamp={2} mb={6} size="xs">
                                        {course.summary}
                                    </Text>
                                )}
                                <PriceText discount={course.sale_price_cents ?? undefined} price={course.list_price_cents} />
                                <Group gap={8} mb="md" mt={4}>
                                    <Text c="yellow.7" size="xs">
                                        ★ 4.8
                                    </Text>
                                    <Text c="dimmed" size="xs">
                                        수강생 1,200명
                                    </Text>
                                </Group>
                                <EnrollWishlistActions
                                    enrolled={enrolled}
                                    size="xs"
                                    userId={userId}
                                    wish={wish}
                                    onEnroll={() => handleEnroll(course.id, enrolled)}
                                    onToggleWish={() => handleWishlist(course.id)}
                                />
                                <Button fullWidth component={Link} leftSection={<Eye size={14} />} mt="sm" radius="md" size="xs" to={`/course/${course.id}`} variant="light">
                                    자세히 보기
                                </Button>
                            </Card>
                        );
                    })}
                    {filtered.length === 0 && (
                        <EmptyState actionLabel="필터 초기화" message="검색어나 필터를 조정해 다시 시도해 주세요." title="코스를 찾을 수 없어요" onActionClick={handleResetFilters} />
                    )}
                </CourseGrid>
            </PageSection>
        </PageContainer>
    );
};

export default CourseListPage;

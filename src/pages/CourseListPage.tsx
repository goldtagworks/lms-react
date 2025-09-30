import { Card, Button, Group, Select, TextInput, Badge } from '@mantine/core';
import { Eye } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
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
import { useI18n } from '@main/lib/i18n';
import { TextTitle, TextBody, TextMeta } from '@main/components/typography';
import PaginationBar from '@main/components/PaginationBar';
import { useAuth } from '@main/lib/auth';
// Removed react-i18next usage in favor of internal i18n hook

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

    // Pagination state (client-side for mock data)
    const PAGE_SIZE = 12;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const paged = filtered.slice(start, start + PAGE_SIZE);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

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

    const { t } = useI18n();

    const categories = [
        { value: 'all', label: t('category.all', {}, '전체') },
        { value: 'frontend', label: t('category.frontend', {}, '프론트엔드') },
        { value: 'backend', label: t('category.backend', {}, '백엔드') },
        { value: 'data', label: t('category.data', {}, '데이터분석') },
        { value: 'ai', label: t('category.ai', {}, 'AI/ML') },
        { value: 'cert', label: t('category.cert', {}, '자격증') },
        { value: 'biz', label: t('category.biz', {}, '비즈니스') }
    ];

    return (
        <PageContainer roleMain>
            <PageHeader isMainTitle description={t('course.list.description')} title={t('course.list.title')} />
            <PageSection withGapTop={false}>
                {/* 필터/정렬/검색 UI */}
                <Group gap="md" mb="xl" wrap="wrap">
                    <Select aria-label={t('a11y.categorySelect', {}, '카테고리')} data={categories} defaultValue="all" size="sm" value={category} onChange={(v) => setCategory(v || 'all')} />
                    <Select
                        aria-label={t('a11y.sortSelect', {}, '정렬')}
                        data={[
                            { value: 'latest', label: t('sort.latest', {}, '최신순') },
                            { value: 'popular', label: t('sort.popular', {}, '인기순') },
                            { value: 'rating', label: t('sort.rating', {}, '평점순') }
                        ]}
                        defaultValue="latest"
                        size="sm"
                    />
                    <TextInput
                        aria-label={t('a11y.search', {}, '검색')}
                        miw={220}
                        placeholder={t('a11y.searchPlaceholder', {}, '강의명/키워드 검색')}
                        size="sm"
                        value={query}
                        onChange={(e) => setQuery(e.currentTarget.value)}
                    />
                    <Button disabled size="sm" variant="outline">
                        {t('empty.sortStub', {}, '정렬(스텁)')}
                    </Button>
                </Group>
                <CourseGrid listMode>
                    {paged.map((course) => {
                        const enrolled = userId ? isEnrolled(userId, course.id) : false;
                        const wish = userId ? isWishlisted(userId, course.id) : false;

                        return (
                            <Card key={course.id} withBorder p="lg" radius="md" shadow="sm">
                                <AppImage alt={course.title} height={140} mb={12} radius="lg" src={course.thumbnail_url || ''} />
                                <Group align="center" justify="space-between" mb={4} wrap="nowrap">
                                    <TextTitle>{course.title}</TextTitle>
                                    <Group gap={4}>
                                        {enrolled && (
                                            <Badge color="green" size="xs">
                                                {t('enroll.enrolled', {}, '수강중')}
                                            </Badge>
                                        )}
                                        {wish && (
                                            <Badge color="pink" size="xs">
                                                {t('common.favorite.add')}
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
                                    <TextBody c="dimmed" lineClamp={2} mb={6}>
                                        {course.summary}
                                    </TextBody>
                                )}
                                <PriceText discount={course.sale_price_cents ?? undefined} price={course.list_price_cents} />
                                <Group gap={8} mb="md" mt={4}>
                                    <TextMeta c="yellow.7">★ 4.8</TextMeta>
                                    <TextMeta>수강생 1,200명</TextMeta>
                                </Group>
                                <EnrollWishlistActions
                                    enrolled={enrolled}
                                    size="sm"
                                    userId={userId}
                                    wish={wish}
                                    onEnroll={() => handleEnroll(course.id, enrolled)}
                                    onToggleWish={() => handleWishlist(course.id)}
                                />
                                <Button fullWidth component={Link} leftSection={<Eye size={14} />} mt="sm" radius="md" size="sm" to={`/course/${course.id}`} variant="light">
                                    {t('terms.viewDetails')}
                                </Button>
                            </Card>
                        );
                    })}
                    {filtered.length === 0 && (
                        <EmptyState
                            actionLabel={t('common.resetFilters', {}, '필터 초기화')}
                            message={t('empty.coursesFiltered', {}, '검색어나 필터를 조정해 다시 시도해 주세요.')}
                            title={t('empty.coursesNotFound', {}, '코스를 찾을 수 없어요')}
                            onActionClick={handleResetFilters}
                        />
                    )}
                </CourseGrid>
                <PaginationBar align="right" page={page} totalPages={totalPages} onChange={setPage} />
            </PageSection>
        </PageContainer>
    );
};

export default CourseListPage;

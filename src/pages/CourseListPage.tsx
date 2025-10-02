import { Card, Button, Group, Select, TextInput, Badge } from '@mantine/core';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { TagChip } from '@main/components/TagChip';
import { Link } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PageSection from '@main/components/layout/PageSection';
import CourseGrid from '@main/components/layout/CourseGrid';
import AppImage from '@main/components/AppImage';
import PriceText from '@main/components/price/PriceText';
import { enrollAndNotify, isEnrolled, isWishlisted, toggleWishlistAndNotify } from '@main/lib/repository';
import useCoursesPaged from '@main/hooks/course/useCoursesPaged';
import EnrollWishlistActions from '@main/components/EnrollWishlistActions';
import EmptyState from '@main/components/EmptyState';
import { useI18n } from '@main/lib/i18n';
import { TextTitle, TextBody, TextMeta } from '@main/components/typography';
import PaginationBar from '@main/components/PaginationBar';
import { useAuth } from '@main/lib/auth';
// Removed react-i18next usage in favor of internal i18n hook

// repository seed 사용

const CourseListPage = () => {
    const [page, setPage] = useState(1);
    const { user } = useAuth();
    const userId = user?.id;
    const [category, setCategory] = useState<string>('all');
    const [query, setQuery] = useState<string>('');

    const { data } = useCoursesPaged(page, { pageSize: 12, categoryId: category !== 'all' ? category : undefined, q: query });
    const filteredTotal = data?.total || 0;
    const totalPages = data?.pageCount || 1;
    const paged = data?.items || [];

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
                        {t('empty.sortNoResults', {}, '정렬 결과 없음')}
                    </Button>
                </Group>
                <CourseGrid listMode>
                    {paged.map((course) => {
                        const enrolled = userId ? isEnrolled(userId, course.id) : false;
                        const wish = userId ? isWishlisted(userId, course.id) : false;

                        return (
                            <Card key={course.id} withBorder p="lg" radius="lg" shadow="sm">
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
                                            {course.featured_badge_text || (course.featured_rank ? `추천 #${course.featured_rank}` : '추천')}
                                        </Badge>
                                    )}
                                    {course.tags?.map((tag) => (
                                        <TagChip key={tag} label={tag} />
                                    ))}
                                </Group>
                                {(() => {
                                    const summary = course.summary || (course.description || '').slice(0, 120);

                                    return summary ? (
                                        <TextBody c="dimmed" lineClamp={2} mb={6}>
                                            {summary}
                                        </TextBody>
                                    ) : null;
                                })()}
                                <PriceText discount={course.sale_price_cents ?? undefined} price={course.price_cents} />
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
                    {filteredTotal === 0 && (
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

import { Text, Card, Group, Button, Badge, Stack } from '@mantine/core';
import { Eye } from 'lucide-react';
import EmptyState from '@main/components/EmptyState';
import { useI18n } from '@main/lib/i18n';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import { useAuth } from '@main/lib/auth';
import { useState, useEffect } from 'react';
import PaginationBar from '@main/components/PaginationBar';
import { useCourses, useWishlistState, isWishlisted, toggleWishlistAndNotify, isEnrolled, enrollAndNotify } from '@main/lib/repository';
import EnrollWishlistActions from '@main/components/EnrollWishlistActions';
import AppImage from '@main/components/AppImage';
import PriceText from '@main/components/price/PriceText';
import { Link } from 'react-router-dom';
import { TagChip } from '@main/components/TagChip';
import CourseGrid from '@main/components/layout/CourseGrid';

export default function WishlistPage() {
    const { t } = useI18n();
    const { user } = useAuth();
    const userId = user?.id;
    const allCourses = useCourses();
    const wishlist = useWishlistState(userId);

    const wishCourses = allCourses.filter((c) => (userId ? isWishlisted(userId, c.id) : false));
    const PAGE_SIZE = 12;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(wishCourses.length / PAGE_SIZE));
    const paged = wishCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const handleToggle = (courseId: string) => {
        if (!userId) return;
        toggleWishlistAndNotify(userId, courseId);
    };
    const handleEnroll = (courseId: string) => {
        if (!userId) return;
        if (isEnrolled(userId, courseId)) return;
        enrollAndNotify(userId, courseId);
    };

    return (
        <PageContainer roleMain>
            <PageHeader description={t('empty.wishlistPageIntro', {}, '나중에 수강하고 싶은 강의를 한 곳에서 관리하세요.')} title={t('terms.favoriteAdd', {}, '찜')} />
            <Card withBorder p="lg" radius="md" shadow="sm">
                <Stack gap="md">
                    <Group align="center" justify="space-between">
                        <Text fw={700} size="lg">
                            {t('terms.favoriteAdd')} 강의
                        </Text>
                        {userId && wishlist.length > 0 && (
                            <Badge color="pink" variant="light">
                                {wishlist.length}개
                            </Badge>
                        )}
                    </Group>
                    {!userId && (
                        <EmptyState
                            actionLabel={t('common.login', {}, '로그인')}
                            message={t('empty.wishlistLoginNeeded', {}, '로그인 후 찜 기능을 사용할 수 있습니다.')}
                            title={t('empty.wishlistInfo', {}, '찜 기능 안내')}
                            to="/signin"
                        />
                    )}
                    {userId && wishlist.length === 0 && (
                        <EmptyState
                            actionLabel={t('empty.exploreCourses', {}, '강의 둘러보기')}
                            message={t('empty.wishlistNone', {}, '아직 찜한 강의가 없습니다.')}
                            title={t('empty.wishlistEmpty', {}, '찜한 강의 없음')}
                            to="/courses"
                        />
                    )}
                    {userId && wishlist.length > 0 && (
                        <CourseGrid mt="md">
                            {paged.map((course) => {
                                const enrolled = userId ? isEnrolled(userId, course.id) : false;
                                const wish = userId ? isWishlisted(userId, course.id) : false;

                                return (
                                    <Card key={course.id} withBorder p="lg" radius="md" shadow="sm">
                                        <AppImage alt={course.title} height={120} mb={12} radius="lg" src={course.thumbnail_url || ''} />
                                        <Group align="center" justify="space-between" mb={4} wrap="nowrap">
                                            <Text fw={700} size="md">
                                                {course.title}
                                            </Text>
                                            <Group gap={4}>
                                                {enrolled && (
                                                    <Badge color="green" size="sm">
                                                        수강중
                                                    </Badge>
                                                )}
                                                {wish && (
                                                    <Badge color="pink" size="sm">
                                                        {t('terms.favoriteAdd')}
                                                    </Badge>
                                                )}
                                            </Group>
                                        </Group>
                                        <Group gap={4} mb={4}>
                                            {course.tags?.map((tag) => (
                                                <TagChip key={tag} label={tag} />
                                            ))}
                                        </Group>
                                        {course.summary && (
                                            <Text c="dimmed" lineClamp={2} mb={6} size="sm">
                                                {course.summary}
                                            </Text>
                                        )}
                                        <PriceText discount={course.sale_price_cents ?? undefined} price={course.list_price_cents} />
                                        <EnrollWishlistActions
                                            enrolled={enrolled}
                                            size="sm"
                                            userId={userId}
                                            wish={wish}
                                            onEnroll={() => handleEnroll(course.id)}
                                            onToggleWish={() => handleToggle(course.id)}
                                        />
                                        <Button fullWidth component={Link} leftSection={<Eye size={14} />} mt={8} radius="md" size="md" to={`/course/${course.id}`} variant="default">
                                            {t('terms.viewDetails')}
                                        </Button>
                                    </Card>
                                );
                            })}
                        </CourseGrid>
                    )}
                    <PaginationBar align="right" page={page} totalPages={totalPages} onChange={setPage} />
                </Stack>
            </Card>
        </PageContainer>
    );
}

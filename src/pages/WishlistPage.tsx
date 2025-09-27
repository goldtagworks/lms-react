import { Text, Card, Group, Button, Badge, Stack } from '@mantine/core';
import { Eye } from 'lucide-react';
import EmptyState from '@main/components/EmptyState';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import { useAuth } from '@main/lib/auth';
import { useCourses, useWishlistState, isWishlisted, toggleWishlistAndNotify, isEnrolled, enrollAndNotify } from '@main/lib/repository';
import EnrollWishlistActions from '@main/components/EnrollWishlistActions';
import AppImage from '@main/components/AppImage';
import PriceText from '@main/components/price/PriceText';
import { Link } from 'react-router-dom';
import { TagChip } from '@main/components/TagChip';
import CourseGrid from '@main/components/layout/CourseGrid';

export default function WishlistPage() {
    const { user } = useAuth();
    const userId = user?.id;
    const allCourses = useCourses();
    const wishlist = useWishlistState(userId);

    const wishCourses = allCourses.filter((c) => (userId ? isWishlisted(userId, c.id) : false));

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
            <PageHeader description="나중에 수강하고 싶은 강의를 한 곳에서 관리하세요." title="위시리스트" />
            <Card withBorder p="lg" radius="md" shadow="sm">
                <Stack gap="md">
                    <Group align="center" justify="space-between">
                        <Text fw={700} size="lg">
                            위시한 강의
                        </Text>
                        {userId && wishlist.length > 0 && (
                            <Badge color="pink" variant="light">
                                {wishlist.length}개
                            </Badge>
                        )}
                    </Group>
                    {!userId && <EmptyState actionLabel="로그인" message="로그인 후 위시리스트를 사용할 수 있습니다." title="위시리스트 이용 안내" to="/signin" />}
                    {userId && wishlist.length === 0 && <EmptyState actionLabel="강의 둘러보기" message="아직 찜한 강의가 없습니다." title="위시한 강의 없음" to="/courses" />}
                    {userId && wishlist.length > 0 && (
                        <CourseGrid mt="md">
                            {wishCourses.map((course) => {
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
                                        <EnrollWishlistActions
                                            enrolled={enrolled}
                                            size="xs"
                                            userId={userId}
                                            wish={wish}
                                            onEnroll={() => handleEnroll(course.id)}
                                            onToggleWish={() => handleToggle(course.id)}
                                        />
                                        <Button fullWidth component={Link} leftSection={<Eye size={14} />} mt={8} radius="md" size="xs" to={`/course/${course.id}`} variant="default">
                                            자세히 보기
                                        </Button>
                                    </Card>
                                );
                            })}
                        </CourseGrid>
                    )}
                </Stack>
            </Card>
        </PageContainer>
    );
}

import { Title, Text, Button, Group, Card, Badge } from '@mantine/core';
import { List, Heart, Award, Home, ArrowRight } from 'lucide-react';
import EmptyState from '@main/components/EmptyState';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import { Link } from 'react-router-dom';
import { useAuth } from '@main/lib/auth';
import { useEnrollmentsState, useCourses, isEnrolled, isWishlisted } from '@main/lib/repository';
import EnrollWishlistActions from '@main/components/EnrollWishlistActions';
import AppImage from '@main/components/AppImage';
import { TagChip } from '@main/components/TagChip';
import CourseGrid from '@main/components/layout/CourseGrid';
import PriceText from '@main/components/price/PriceText';

export default function MyPage() {
    const { user } = useAuth();
    const userId = user?.id;
    const enrollments = useEnrollmentsState(userId);
    const courses = useCourses();

    const enrolledCourses = enrollments.map((e) => courses.find((c) => c.id === e.course_id)).filter((c): c is NonNullable<typeof c> => !!c);

    return (
        <PageContainer roleMain>
            <PageHeader
                actions={
                    <Group gap="xs">
                        <Button component={Link} leftSection={<List size={16} />} to="/courses" variant="light">
                            코스 목록
                        </Button>
                        <Button component={Link} leftSection={<Heart size={16} />} to="/my/wishlist" variant="light">
                            위시리스트
                        </Button>
                        <Button component={Link} leftSection={<Award size={16} />} to="/my/certificates" variant="light">
                            수료증
                        </Button>
                        <Button component={Link} leftSection={<Home size={16} />} to="/" variant="outline">
                            홈으로
                        </Button>
                    </Group>
                }
                description="내 정보, 수강 내역, 수료증, 위시리스트 등을 관리할 수 있습니다."
                title="마이페이지"
            />
            <Title mb="sm" order={2} size="lg">
                수강중 강의
            </Title>
            {!userId && <EmptyState actionLabel="로그인" message="로그인 후 수강 내역을 확인할 수 있습니다." title="로그인 필요" to="/signin" />}
            {userId && enrolledCourses.length === 0 && <EmptyState actionLabel="강의 탐색" message="아직 수강중인 강의가 없습니다." title="수강중 강의 없음" to="/courses" />}
            {userId && enrolledCourses.length > 0 && (
                <CourseGrid mt="md">
                    {enrolledCourses.map((course) => {
                        const wish = isWishlisted(userId!, course.id);
                        const enrolled = isEnrolled(userId!, course.id);

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
                                    onEnroll={() => {
                                        /* no-op: 이미 수강중이면 비활성화 */
                                    }}
                                    onToggleWish={() => {
                                        /* MyPage에서 위시 토글 기능은 후속 필요 시 구현 */
                                    }}
                                />
                                <Button fullWidth color="orange" component={Link} leftSection={<ArrowRight size={14} />} mt={8} radius="md" size="xs" to={`/course/${course.id}`} variant="light">
                                    이어서 학습
                                </Button>
                            </Card>
                        );
                    })}
                </CourseGrid>
            )}
        </PageContainer>
    );
}

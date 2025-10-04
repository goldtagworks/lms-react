import { Text, Button, Group, Card, Badge, Stack } from '@mantine/core';
import { List, Heart, Award, Home, ArrowRight } from 'lucide-react';
import EmptyState from '@main/components/EmptyState';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import { Link } from 'react-router-dom';
import { useAuth } from '@main/lib/auth';
import { useState } from 'react';
import PaginationBar from '@main/components/PaginationBar';
import { isEnrolled, isWishlisted } from '@main/lib/repository';
import useEnrollmentsPaged from '@main/hooks/useEnrollmentsPaged';
import EnrollWishlistActions from '@main/components/EnrollWishlistActions';
import { useI18n } from '@main/lib/i18n';
import AppImage from '@main/components/AppImage';
import { TagChip } from '@main/components/TagChip';
import CourseGrid from '@main/components/layout/CourseGrid';
import PriceText from '@main/components/price/PriceText';

export default function MyPage() {
    const { t } = useI18n();
    const { user } = useAuth();
    const userId = user?.id;
    const [page, setPage] = useState(1);
    const { data } = useEnrollmentsPaged(userId, page, { pageSize: 8 });
    const enrolledCourses = data?.items || [];
    const totalPages = data?.pageCount || 1;

    return (
        <PageContainer roleMain>
            <PageHeader
                actions={
                    <Group gap="xs">
                        <Button color="orange" component={Link} leftSection={<List size={16} />} size="sm" to="/courses" variant="light">
                            {t('nav.courses', {}, '코스 목록')}
                        </Button>
                        <Button color="green" component={Link} leftSection={<Heart size={16} />} size="sm" to="/my/wishlist" variant="light">
                            {t('common.favorite.add')}
                        </Button>
                        <Button color="violet" component={Link} leftSection={<Award size={16} />} size="sm" to="/my/certificates" variant="light">
                            {t('nav.certificates', {}, '수료증')}
                        </Button>
                        <Button component={Link} leftSection={<Home size={16} />} size="sm" to="/" variant="outline">
                            {t('nav.home', {}, '홈으로')}
                        </Button>
                    </Group>
                }
                description={t(
                    'empty.myPageIntro',
                    { favorite: t('common.favorite.add', {}, '찜') },
                    `내 정보, 수강 내역, 수료증, ${t('common.favorite.add', {}, '찜')} 목록 등을 관리할 수 있습니다.`
                )}
                title={t('nav.myPage', {}, '마이페이지')}
            />
            <Card withBorder p="lg" radius="lg" shadow="sm">
                <Stack gap="md">
                    <Group align="center" justify="space-between">
                        <Text fw={700} size="lg">
                            {t('empty.enrolledCoursesHeader', {}, '수강중 강의')}
                        </Text>
                        {userId && enrolledCourses.length > 0 && (
                            <Badge color="teal" variant="light">
                                {enrolledCourses.length}개
                            </Badge>
                        )}
                    </Group>
                    {userId && enrolledCourses.length === 0 && (
                        <EmptyState
                            actionLabel={t('empty.exploreCourses', {}, '강의 탐색')}
                            message={t('empty.enrollmentsNone', {}, '아직 수강중인 강의가 없습니다.')}
                            title={t('empty.enrollmentsEmpty', {}, '수강중 강의 없음')}
                            to="/courses"
                        />
                    )}
                    {userId && enrolledCourses.length > 0 && (
                        <CourseGrid mt="md">
                            {enrolledCourses.map((course) => {
                                const wish = isWishlisted(userId!, course.id);
                                const enrolled = isEnrolled(userId!, course.id);

                                return (
                                    <Card key={course.id} withBorder p="lg" radius="lg" shadow="sm">
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
                                                        {t('common.favorite.add')}
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
                                            onEnroll={() => {
                                                /* no-op: 이미 수강중이면 비활성화 */
                                            }}
                                            onToggleWish={() => {
                                                /* MyPage에서 위시 토글 기능은 후속 필요 시 구현 */
                                            }}
                                        />
                                        <Button
                                            fullWidth
                                            color="orange"
                                            component={Link}
                                            leftSection={<ArrowRight size={14} />}
                                            mt={8}
                                            radius="md"
                                            size="sm"
                                            to={`/course/${course.id}`}
                                            variant="light"
                                        >
                                            {t('empty.continueLearning', {}, '이어서 학습')}
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

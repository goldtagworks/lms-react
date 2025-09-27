import { Button, Card, Group, Text, Box, SimpleGrid, Divider, Avatar, Tabs, List, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { TagChip } from '@main/components/TagChip';
import { Link } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import PageSection from '@main/components/layout/PageSection';
import PageHeader from '@main/components/layout/PageHeader';
import { Share2, Copy, Pencil, Plus } from 'lucide-react';
import useCopyLink from '@main/hooks/useCopyLink';
import AppImage from '@main/components/AppImage';
import PriceText from '@main/components/price/PriceText';
import { useParams } from 'react-router-dom';
import { useAuth } from '@main/lib/auth';
import { useCourse, enrollAndNotify, isEnrolled, isWishlisted, toggleWishlistAndNotify, useLessons } from '@main/lib/repository';
import EnrollWishlistActions from '@main/components/EnrollWishlistActions';
import EmptyState from '@main/components/EmptyState';

export default function CourseDetailPage() {
    const { id: rawId } = useParams();
    // 라우터가 숫자 id (/course/1)로 들어오면 seed id(c1..) 매핑
    const mappedId = !rawId ? undefined : rawId.startsWith('c') ? rawId : 'c' + rawId;
    const course = useCourse(mappedId);
    const { user } = useAuth();
    const userId = user?.id;
    const enrolled = userId && course?.id ? isEnrolled(userId, course.id) : false;
    const wish = userId && course?.id ? isWishlisted(userId, course.id) : false;
    const lessons = useLessons(course?.id);

    // 공유/복사 상태 공통 훅
    const { copied, copy } = useCopyLink(1200);

    const handleCopy = () => copy();

    const handleEnroll = () => {
        if (!userId || !course?.id) return; // 로그인 안됨
        if (!enrolled) {
            enrollAndNotify(userId, course.id);
        }
    };

    const handleWishlist = () => {
        if (!userId || !course?.id) return;
        toggleWishlistAndNotify(userId, course.id);
    };

    if (!course) {
        return (
            <PageContainer roleMain>
                <EmptyState actionLabel="목록으로" message="존재하지 않거나 삭제된 강의입니다." title="강의를 찾을 수 없음" to="/courses" />
            </PageContainer>
        );
    }

    return (
        <PageContainer roleMain>
            <Group align="flex-start" justify="space-between" mb="md" wrap="nowrap">
                <Box style={{ flex: 1 }}>
                    <PageHeader description={course.summary || ''} descriptionSize="md" title={course.title} titleSize="xl" />
                </Box>
                <Group gap={4} mt={8} wrap="nowrap">
                    <Tooltip withArrow label="강의 수정">
                        <ActionIcon aria-label="강의 수정" component={Link} to={`/instructor/courses/${course.id}/edit`} variant="subtle">
                            <Pencil size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip withArrow label="새 강의 작성">
                        <ActionIcon aria-label="새 강의 작성" component={Link} to="/instructor/courses/new" variant="subtle">
                            <Plus size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip withArrow label={copied ? '복사됨' : '링크 복사'}>
                        <ActionIcon aria-label="링크 복사" color={copied ? 'teal' : undefined} variant="subtle" onClick={handleCopy}>
                            {copied ? <Copy size={18} /> : <Share2 size={18} />}
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
            {/* content grid */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {/* 좌측: 썸네일/가격/수강신청 */}
                <Box>
                    <Card withBorder p="xl" radius="md" shadow="sm">
                        <AppImage alt={course.title} height={220} mb={16} radius="lg" src={course.thumbnail_url || ''} />
                        <Group gap={4} mb={8}>
                            {course.tags?.map((tag) => (
                                <TagChip key={tag} label={tag} />
                            ))}
                        </Group>
                        <PriceText discount={course.sale_price_cents ?? undefined} price={course.list_price_cents} size="lg" />
                        <Group align="center" gap={8} mb="lg">
                            {enrolled && (
                                <Badge color="green" size="sm">
                                    수강중
                                </Badge>
                            )}
                            {wish && (
                                <Badge color="pink" size="sm">
                                    위시
                                </Badge>
                            )}
                            {!enrolled && !wish && (
                                <Text c="dimmed" size="xs">
                                    상태: 미수강
                                </Text>
                            )}
                            <Text c="yellow.7" size="xs">
                                ★ 4.8
                            </Text>
                            <Text c="dimmed" size="xs">
                                수강생 1,200명
                            </Text>
                        </Group>
                        <EnrollWishlistActions
                            enrolled={enrolled}
                            labels={{ enroll: '수강신청', loginRequired: '로그인 필요', wishAdd: '위시 담기' }}
                            size="sm"
                            userId={userId}
                            wish={wish}
                            onEnroll={handleEnroll}
                            onToggleWish={handleWishlist}
                        />
                        <Button fullWidth component={Link} mt="sm" radius="md" size="sm" to="/courses" variant="outline">
                            목록으로
                        </Button>
                    </Card>
                    {/* 강사 정보 */}
                    <Card withBorder mt="lg" p="lg" radius="md" shadow="sm">
                        <Group align="center" gap={16}>
                            <Avatar radius="xl" size={56} src={''} />
                            <Box>
                                <Text fw={700} size="lg">
                                    강사명(샘플)
                                </Text>
                                <Text c="dimmed" size="sm">
                                    강사 프로필은 별도 fetch 예정
                                </Text>
                            </Box>
                        </Group>
                    </Card>
                </Box>
                {/* 우측: 상세/커리큘럼/후기/Q&A */}
                <Box>
                    <Tabs color="blue" defaultValue="desc">
                        <Tabs.List>
                            <Tabs.Tab value="desc">강의 소개</Tabs.Tab>
                            <Tabs.Tab value="curriculum">커리큘럼</Tabs.Tab>
                            <Tabs.Tab value="reviews">후기</Tabs.Tab>
                            <Tabs.Tab value="qna">Q&A</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel pt="md" value="desc">
                            <Text lh={1.6} mb={16} size="md">
                                {course.description}
                            </Text>
                            <Divider my="md" />
                            <Text c="dimmed" size="sm">
                                {course.summary}
                            </Text>
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="curriculum">
                            {lessons.length === 0 && (
                                <Text c="dimmed" size="sm">
                                    레슨이 아직 없습니다.
                                </Text>
                            )}
                            {lessons.length > 0 && (
                                <List center size="sm" spacing="xs">
                                    {lessons.map((l) => (
                                        <List.Item
                                            key={l.id}
                                            icon={
                                                l.is_preview ? (
                                                    <Badge color="blue" size="xs" variant="light">
                                                        P
                                                    </Badge>
                                                ) : undefined
                                            }
                                        >
                                            <Group gap={6} wrap="nowrap">
                                                <Text size="sm" style={{ flex: 1 }}>
                                                    {l.order_index}. {l.title}
                                                </Text>
                                                <Text c="dimmed" size="xs">
                                                    {(l.duration_seconds / 60).toFixed(0)}분
                                                </Text>
                                            </Group>
                                        </List.Item>
                                    ))}
                                </List>
                            )}
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="reviews">
                            <Text c="dimmed" size="sm">
                                후기 기능은 추후 구현 예정입니다.
                            </Text>
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="qna">
                            <Text c="dimmed" size="sm">
                                Q&A 기능은 추후 구현 예정입니다.
                            </Text>
                        </Tabs.Panel>
                    </Tabs>
                </Box>
            </SimpleGrid>
            <PageSection withGapTop headingOrder={2} title="강의 소개 더 보기">
                <Text c="dimmed" size="sm">
                    이 영역은 추가 마케팅/추천 또는 관련 코스 리스트가 들어갈 자리(placeholder) 입니다.
                </Text>
            </PageSection>
        </PageContainer>
    );
}

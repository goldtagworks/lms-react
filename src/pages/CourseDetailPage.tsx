import { Button, Card, Group, Text, Box, SimpleGrid, Divider, Avatar, Tabs, Badge, ActionIcon, Tooltip, TextInput, Switch, Stack, Textarea, AspectRatio } from '@mantine/core';
import MarkdownView from '@main/components/markdown/MarkdownView';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { TagChip } from '@main/components/TagChip';
import { Link } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import PageSection from '@main/components/layout/PageSection';
import PageHeader from '@main/components/layout/PageHeader';
import { Share2, Copy, Pencil, Plus, Trash2, Undo2, Award, ThumbsUp } from 'lucide-react';
import useCopyLink from '@main/hooks/useCopyLink';
import AppImage from '@main/components/AppImage';
import PriceText from '@main/components/price/PriceText';
import { useParams } from 'react-router-dom';
import { useAuth } from '@main/lib/auth';
import {
    useCourse,
    enrollAndNotify,
    isEnrolled,
    isWishlisted,
    toggleWishlistAndNotify,
    useLessons,
    toggleCourseActive,
    updateCoursePartial,
    useMarketingCopy,
    upsertMarketingCopy
} from '@main/lib/repository';
import EnrollWishlistActions from '@main/components/EnrollWishlistActions';
import EmptyState from '@main/components/EmptyState';
import CourseReviewsSection from '@main/components/reviews/CourseReviewsSection';
import CourseQnASection from '@main/components/qna/CourseQnASection';

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
    const marketingCopy = useMarketingCopy(course?.id);

    // 커리큘럼: 단일 lessons 배열 내에서 is_section=true 를 헤더로 사용
    // 기존 section_id 그룹핑 제거됨. 렌더 단계에서 순차 스캔하며 헤더 블록 생성.
    const curriculumBlocks = (() => {
        if (!lessons.length) {
            return [] as { header?: (typeof lessons)[number]; items: typeof lessons }[];
        }

        const ordered = [...lessons].sort((a, b) => a.order_index - b.order_index);
        const blocks: { header?: (typeof ordered)[number]; items: typeof ordered }[] = [];
        let current: { header?: (typeof ordered)[number]; items: typeof ordered } | null = null;

        for (const l of ordered) {
            if (l.is_section) {
                // 새 블록 시작
                current = { header: l, items: [] };
                blocks.push(current);
                continue;
            }

            if (!current) {
                // 헤더 없이 시작하는 레슨들 -> implicit 블록
                current = { header: undefined, items: [] };
                blocks.push(current);
            }
            current.items.push(l);
        }

        return blocks;
    })();

    // 공유/복사 상태 공통 훅
    const { copied, copy } = useCopyLink(1200);

    const handleCopy = () => copy();

    const handleToggleActive = () => {
        if (!course?.id) return;
        const willDeactivate = course.is_active;

        modals.openConfirmModal({
            title: willDeactivate ? '강의 비활성화' : '강의 활성화',
            centered: true,
            labels: { confirm: willDeactivate ? '비활성화' : '활성화', cancel: '취소' },
            confirmProps: { color: willDeactivate ? 'red' : 'teal' },
            children: (
                <Text size="sm">
                    {willDeactivate ? '이 강의는 학습자에게 더 이상 노출되지 않습니다. 진행중인 수강에는 영향이 없으며 언제든 다시 활성화할 수 있습니다.' : '강의를 다시 공개 상태로 전환합니다.'}
                </Text>
            ),
            onConfirm: () => {
                const updated = toggleCourseActive(course.id);

                if (updated) {
                    notifications.show({
                        title: '강의 상태 변경',
                        message: updated.is_active ? '강의가 활성화되었습니다.' : '강의가 비활성화되었습니다.',
                        color: updated.is_active ? 'teal' : 'red'
                    });
                }
            }
        });
    };

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

    const openFeaturedModal = () => {
        if (!course) return;
        let localFeatured = !!course.is_featured;
        let localRank = course.featured_rank ? String(course.featured_rank) : '';
        let localBadge = course.featured_badge_text || '';

        modals.open({
            title: '추천(Featured) 설정',
            centered: true,
            modalId: 'course-featured-modal',
            children: (
                <Stack gap="md" mt="sm">
                    <Switch
                        checked={localFeatured}
                        description="메인/목록에서 상단 강조"
                        label="추천 강조 활성화"
                        onChange={(e) => {
                            localFeatured = e.currentTarget.checked;
                        }}
                    />
                    {localFeatured && (
                        <Group grow>
                            <TextInput
                                defaultValue={localRank}
                                label="추천 순위"
                                placeholder="1"
                                onChange={(e) => {
                                    localRank = e.currentTarget.value;
                                }}
                            />
                            <TextInput
                                defaultValue={localBadge}
                                label="배지 텍스트"
                                placeholder="추천"
                                onChange={(e) => {
                                    localBadge = e.currentTarget.value;
                                }}
                            />
                        </Group>
                    )}
                    <Group justify="flex-end" mt="sm">
                        <Button variant="default" onClick={() => modals.close('course-featured-modal')}>
                            취소
                        </Button>
                        <Button
                            onClick={() => {
                                if (!course.id) return;
                                const patch = localFeatured
                                    ? {
                                          is_featured: true,
                                          featured_rank: localRank ? Number(localRank) || 1 : 1,
                                          featured_badge_text: localBadge.trim() || '추천'
                                      }
                                    : { is_featured: false, featured_rank: undefined, featured_badge_text: undefined };
                                const updated = updateCoursePartial(course.id, patch);

                                if (updated) {
                                    notifications.show({ color: 'teal', title: '저장 완료', message: '추천 설정이 업데이트되었습니다.' });
                                } else {
                                    notifications.show({ color: 'red', title: '오류', message: '업데이트 실패' });
                                }
                                modals.close('course-featured-modal');
                            }}
                        >
                            저장
                        </Button>
                    </Group>
                </Stack>
            )
        });
    };

    const openMarketingModal = () => {
        if (!course) return;
        let localHeadline = marketingCopy?.headline || '';
        let localBody = marketingCopy?.body_md || '';

        modals.open({
            title: '마케팅 추천 카피',
            centered: true,
            modalId: 'course-marketing-modal',
            size: '800px',
            children: (
                <Stack gap="lg" mt="sm" style={{ maxWidth: 760 }}>
                    <Group grow style={{ alignItems: 'flex-start' }} wrap="nowrap">
                        <TextInput
                            defaultValue={localHeadline}
                            label="헤드라인"
                            maxLength={120}
                            placeholder="(최대 120자) 강의의 핵심 가치를 한 줄로 강조"
                            onChange={(e) => {
                                localHeadline = e.currentTarget.value;
                            }}
                        />
                    </Group>
                    <Textarea
                        autosize
                        defaultValue={localBody}
                        label="상세 추천 문구"
                        maxLength={1200}
                        minRows={10}
                        placeholder={`(최대 1200자) 구매 전환을 유도할 내용을 작성하세요.\n• 문제 인식\n• 해결 관점\n• 학습 후 기대 가치\n• 차별 요소`}
                        onChange={(e) => {
                            localBody = e.currentTarget.value;
                        }}
                    />
                    <Group justify="space-between" mt="sm">
                        <Text c="dimmed" size="xs">
                            {`헤드라인 ${localHeadline.length}/120 · 본문 ${localBody.length}/1200`}
                        </Text>
                        <Group gap="xs">
                            <Button variant="default" onClick={() => modals.close('course-marketing-modal')}>
                                취소
                            </Button>
                            <Button
                                onClick={() => {
                                    if (!course.id) return;
                                    const saved = upsertMarketingCopy(course.id, { headline: localHeadline.trim() || undefined, body_md: localBody.trim() || undefined });

                                    notifications.show({ color: 'teal', message: saved.headline ? '마케팅 카피가 업데이트되었습니다.' : '카피가 비워져 제거되었습니다.', title: '저장 완료' });
                                    modals.close('course-marketing-modal');
                                }}
                            >
                                저장
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            )
        });
    };

    if (!course) {
        return (
            <PageContainer roleMain>
                <EmptyState actionLabel="목록으로" message="존재하지 않거나 삭제된 강의입니다." title="강의를 찾을 수 없음" to="/courses" />
            </PageContainer>
        );
    }

    // ----- Preview Lesson (first is_preview true) -----
    const previewLesson = (() => {
        if (!lessons.length) return undefined;
        const ordered = [...lessons].sort((a, b) => a.order_index - b.order_index);

        return ordered.find((l) => l.is_preview && !!l.content_url);
    })();

    function renderPreviewPlayer() {
        if (!previewLesson) return null;
        const url = previewLesson.content_url!;
        let embed: React.ReactNode = null;

        // Very simple YouTube detection; later server can supply embed meta.
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{6,})/);

        if (ytMatch) {
            const videoId = ytMatch[1];

            embed = (
                <AspectRatio maw={960} mx="auto" ratio={16 / 9}>
                    <iframe
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        style={{ border: 0 }}
                        title={previewLesson.title}
                    />
                </AspectRatio>
            );
        } else if (/^https?:/.test(url)) {
            embed = (
                <AspectRatio maw={960} mx="auto" ratio={16 / 9}>
                    <video controls preload="metadata" src={url} style={{ width: '100%', height: '100%', background: '#000', borderRadius: 8 }}>
                        <track kind="captions" label="captions" srcLang="ko" />
                    </video>
                </AspectRatio>
            );
        }

        if (!embed) return null;

        return (
            <Card withBorder mb="lg" p="md" radius="md" shadow="sm">
                <Text c="blue.6" fw={600} mb={8} size="sm">
                    미리보기 영상
                </Text>
                {embed}
                <Text c="dimmed" mt={8} size="xs">
                    이 강의의 무료 미리보기 레슨입니다.
                </Text>
            </Card>
        );
    }

    return (
        <PageContainer roleMain>
            <Group align="flex-start" justify="space-between" mb="md" wrap="nowrap">
                <Box style={{ flex: 1 }}>
                    <Group align="center" gap="sm">
                        <PageHeader description={course.summary || ''} descriptionSize="md" title={course.title} titleSize="xl" />
                        {course.is_featured && (
                            <Badge color="teal" size="sm" variant="filled">
                                {course.featured_badge_text || 'FEATURED'}
                            </Badge>
                        )}
                    </Group>
                </Box>
                <Group gap={4} mt={8} wrap="nowrap">
                    {!course.is_active && (
                        <Badge color="red" mr={4} size="sm" variant="light">
                            비활성
                        </Badge>
                    )}
                    {user?.role === 'admin' && (
                        <Tooltip withArrow label="추천(Featured) 설정">
                            <ActionIcon aria-label="추천 설정" color="teal" variant="subtle" w="100%" onClick={openFeaturedModal}>
                                <Award size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    {user?.role === 'admin' && (
                        <Tooltip withArrow label="마케팅 추천 카피">
                            <ActionIcon aria-label="마케팅 추천 카피" color="grape" variant="subtle" w="100%" onClick={openMarketingModal}>
                                <ThumbsUp size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    {user && (user.role === 'instructor' || user.role === 'admin') && (
                        <Tooltip withArrow label="강의 수정">
                            <ActionIcon
                                aria-label="강의 수정"
                                component={Link}
                                to={user.role === 'admin' ? `/admin/courses/${course.id}/edit` : `/instructor/courses/${course.id}/edit`}
                                variant="subtle"
                            >
                                <Pencil size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    {user?.role === 'admin' && (
                        <Tooltip withArrow label={course.is_active ? '강의 비활성화' : '강의 활성화'}>
                            <ActionIcon aria-label={course.is_active ? '강의 비활성화' : '강의 활성화'} color={course.is_active ? 'red' : 'teal'} variant="subtle" onClick={handleToggleActive}>
                                {course.is_active ? <Trash2 size={16} /> : <Undo2 size={16} />}
                            </ActionIcon>
                        </Tooltip>
                    )}
                    {user && user.role === 'instructor' && (
                        <Tooltip withArrow label="새 강의 작성">
                            <ActionIcon aria-label="새 강의 작성" color="green" component={Link} to="/instructor/courses/new" variant="subtle">
                                <Plus size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    <Tooltip withArrow label={copied ? '복사됨' : '링크 복사'}>
                        <ActionIcon aria-label="링크 복사" color={copied ? 'teal' : 'yellow'} variant="subtle" onClick={handleCopy}>
                            {copied ? <Copy size={16} /> : <Share2 size={16} />}
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
                        <Button fullWidth component={Link} mt="sm" radius="md" size="sm" to="/courses" variant="default">
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
                            <MarkdownView source={course.description || ''} />
                            <Divider my="md" />
                            <Text c="dimmed" size="sm">
                                {course.summary}
                            </Text>
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="curriculum">
                            {renderPreviewPlayer()}
                            {lessons.length === 0 && (
                                <Text c="dimmed" size="sm">
                                    레슨이 아직 없습니다.
                                </Text>
                            )}
                            {lessons.length > 0 && (
                                <Box>
                                    {curriculumBlocks.map((block, bIndex) => {
                                        const list = block.items;
                                        // 빈 블록(헤더만 있고 레슨 없음) skip

                                        if (block.header && list.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <Box key={block.header ? block.header.id : `block-${bIndex}`} mb={bIndex === curriculumBlocks.length - 1 ? 0 : 24}>
                                                {block.header && (
                                                    <Text c="blue.6" fw={600} mb={6} size="sm">
                                                        {block.header.title}
                                                    </Text>
                                                )}
                                                <Box
                                                    aria-label={`커리큘럼 블록 ${bIndex + 1}`}
                                                    component="ul"
                                                    style={{
                                                        listStyle: 'none',
                                                        margin: 0,
                                                        padding: 0,
                                                        border: '1px solid var(--mantine-color-default-border)',
                                                        borderRadius: 8,
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {list.map((l, idx) => {
                                                        const mins = Math.max(1, Math.round(l.duration_seconds / 60));
                                                        const isLast = idx === list.length - 1;
                                                        const clickable = l.is_preview; // 데모: 미리보기만 클릭 가능

                                                        return (
                                                            <Box
                                                                key={l.id}
                                                                className="curriculum-row"
                                                                component="li"
                                                                style={{
                                                                    alignItems: 'center',
                                                                    borderBottom: isLast ? 'none' : '1px solid var(--mantine-color-default-border)',
                                                                    cursor: clickable ? 'pointer' : 'default',
                                                                    display: 'flex',
                                                                    fontSize: 14,
                                                                    gap: 12,
                                                                    padding: '8px 12px',
                                                                    transition: 'background 120ms ease'
                                                                }}
                                                                onClick={() => {
                                                                    if (clickable) {
                                                                        window.alert(`미리보기 재생: ${l.title}`);
                                                                    }
                                                                }}
                                                            >
                                                                <Text c="dimmed" size="xs" style={{ width: 32 }} ta="right">
                                                                    {l.order_index}
                                                                </Text>
                                                                <Text component="div" lineClamp={1} size="sm" style={{ flex: 1, lineHeight: 1.35 }}>
                                                                    {l.title}
                                                                    {l.is_preview && (
                                                                        <Badge color="blue" ml={8} size="xs" variant="light">
                                                                            미리보기
                                                                        </Badge>
                                                                    )}
                                                                </Text>
                                                                <Text c="dimmed" size="xs" style={{ width: 42 }} ta="right">
                                                                    {mins}분
                                                                </Text>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="reviews">
                            {course.id && <CourseReviewsSection courseId={course.id} enrolled={!!enrolled} userId={userId} />}
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="qna">
                            {course.id && <CourseQnASection courseId={course.id} enrolled={!!enrolled} isInstructor={user?.role === 'instructor'} userId={userId} userRole={user?.role} />}
                        </Tabs.Panel>
                    </Tabs>
                </Box>
            </SimpleGrid>
            <PageSection withGapTop headingOrder={2} title="강의 소개 더 보기">
                {marketingCopy?.headline || marketingCopy?.body_md ? (
                    <Card withBorder p="lg" radius="md" shadow="sm">
                        {marketingCopy?.headline && (
                            <Text fw={700} mb={8} size="lg">
                                {marketingCopy.headline}
                            </Text>
                        )}
                        {marketingCopy?.body_md && <MarkdownView compact source={marketingCopy.body_md} />}
                        {!marketingCopy?.headline && !marketingCopy?.body_md && (
                            <Text c="dimmed" size="sm">
                                마케팅 카피가 아직 없습니다.
                            </Text>
                        )}
                    </Card>
                ) : (
                    <Text c="dimmed" size="sm">
                        이 영역은 추가 마케팅/추천 또는 관련 코스 리스트가 들어갈 자리(placeholder) 입니다.
                    </Text>
                )}
            </PageSection>
        </PageContainer>
    );
}

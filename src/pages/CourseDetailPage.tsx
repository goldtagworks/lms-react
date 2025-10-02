import { Button, Card, Group, Text, Box, SimpleGrid, Divider, Avatar, Tabs, Badge, ActionIcon, Tooltip, TextInput, Switch, Stack, Textarea, AspectRatio } from '@mantine/core';
import { TextTitle, TextBody, TextMeta } from '@main/components/typography';
import MarkdownView from '@main/components/markdown/MarkdownView';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { TagChip } from '@main/components/TagChip';
import { Link, useNavigate } from 'react-router-dom';
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
import { useI18n } from '@main/lib/i18n';
import EmptyState from '@main/components/EmptyState';
import CourseReviewsSection from '@main/components/reviews/CourseReviewsSection';
import PaginationBar from '@main/components/PaginationBar';
import { useState } from 'react';
import useCourseReviewsPaged, { ReviewSort as ReviewSortPaged } from '@main/hooks/course/useCourseReviewsPaged';
import CourseQnASection from '@main/components/qna/CourseQnASection';
import useCourseQnAPaged from '@main/hooks/course/useCourseQnAPaged';
import { useUserEnrollments, useFirstLessonId } from '@main/hooks/course/useEnrollment';

export default function CourseDetailPage() {
    const { courseId: rawId } = useParams();
    // 라우터가 숫자 id (/course/1)로 들어오면 seed id(c1..) 매핑
    const mappedId = !rawId ? undefined : rawId.startsWith('c') ? rawId : 'c' + rawId;
    const course = useCourse(mappedId);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [reviewsSort, setReviewsSort] = useState<ReviewSortPaged>('latest');
    const { data: reviewsPaged } = useCourseReviewsPaged(course?.id, reviewsPage, { pageSize: 10, sort: reviewsSort });
    const [qnaPage, setQnaPage] = useState(1);
    const { user } = useAuth();
    const userId = user?.id;
    const navigate = useNavigate();
    const { data: qnaPaged } = useCourseQnAPaged(course?.id, qnaPage, { pageSize: 5, viewerId: userId });
    const enrolled = userId && course?.id ? isEnrolled(userId, course.id) : false;
    const wish = userId && course?.id ? isWishlisted(userId, course.id) : false;
    const { t } = useI18n();
    const lessons = useLessons(course?.id);
    const marketingCopy = useMarketingCopy(course?.id);

    // 사용자의 수강신청 정보 조회
    const { data: userEnrollments } = useUserEnrollments(userId || '');
    const { data: firstLessonId } = useFirstLessonId(course?.id || '');

    // 현재 코스의 수강신청 찾기
    const currentEnrollment = userEnrollments?.find((e) => e.course_id === course?.id && e.status === 'ENROLLED');

    // 커리큘럼: 단일 lessons 배열 내에서 is_section=true 를 헤더로 사용
    // 기존 section_id 그룹핑 제거됨. 렌더 단계에서 순차 스캔하며 헤더 블록 생성.
    // 섹션과 레슨 카운터 분리: 섹션 번호(sectionIndex)는 is_section 항목만 증가, 레슨 번호는 블록 내 index + 1 사용
    const curriculumBlocks = (() => {
        if (!lessons.length) {
            return [] as { header?: (typeof lessons)[number]; items: typeof lessons; sectionIndex?: number }[];
        }

        const ordered = [...lessons].sort((a, b) => a.order_index - b.order_index);
        const blocks: { header?: (typeof ordered)[number]; items: typeof ordered; sectionIndex?: number }[] = [];
        let current: { header?: (typeof ordered)[number]; items: typeof ordered; sectionIndex?: number } | null = null;
        let sectionCounter = 0;

        for (const l of ordered) {
            if (l.is_section) {
                sectionCounter += 1;
                current = { header: l, items: [], sectionIndex: sectionCounter };
                blocks.push(current);
                continue;
            }
            if (!current) {
                current = { header: undefined, items: [] }; // implicit block (섹션 없는 레슨 그룹)
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
            radius: 'md',
            title: willDeactivate ? t('course.detail.toggle.deactivateTitle') : t('course.detail.toggle.activateTitle'),
            centered: true,
            labels: {
                confirm: willDeactivate ? t('common.deactivate') : t('common.activate'),
                cancel: t('common.cancel')
            },
            confirmProps: { color: willDeactivate ? 'red' : 'teal' },
            children: <TextBody>{willDeactivate ? t('course.detail.toggle.deactivateConfirmBody') : t('course.detail.toggle.activateConfirmBody')}</TextBody>,
            onConfirm: () => {
                const updated = toggleCourseActive(course.id);

                if (updated) {
                    notifications.show({
                        title: t('course.detail.toggle.stateChangedTitle'),
                        message: updated.is_active ? t('course.detail.toggle.activatedMessage') : t('course.detail.toggle.deactivatedMessage'),
                        color: updated.is_active ? 'teal' : 'red'
                    });
                }
            }
        });
    };

    const handleEnroll = () => {
        if (!userId || !course?.id) return; // 로그인 안됨
        if (!enrolled) {
            // 유료 코스인 경우 결제 페이지로 이동
            if (course.pricing_mode === 'paid') {
                navigate(`/payment/${course.id}`);
            } else {
                // 무료 코스인 경우 직접 등록
                enrollAndNotify(userId, course.id);
            }
        }
    };

    const handleWishlist = () => {
        if (!userId || !course?.id) return;
        toggleWishlistAndNotify(userId, course.id);
    };

    const handleStartLearning = () => {
        if (!currentEnrollment || !firstLessonId) {
            notifications.show({
                title: t('player.error'),
                message: t('player.enrollmentOrLessonNotFound'),
                color: 'red'
            });

            return;
        }

        // 첫 번째 레슨으로 이동
        navigate(`/enrollments/${currentEnrollment.id}/lessons/${firstLessonId}`);
    };

    const openFeaturedModal = () => {
        if (!course) return;
        let localFeatured = !!course.is_featured;
        let localRank = course.featured_rank ? String(course.featured_rank) : '';
        let localBadge = course.featured_badge_text || '';

        modals.open({
            title: t('course.detail.featured.modal.title'),
            centered: true,
            modalId: 'course-featured-modal',
            children: (
                <Stack gap="md" mt="sm">
                    <Switch
                        checked={localFeatured}
                        description={t('course.detail.featured.modal.description')}
                        label={t('course.detail.featured.modal.switchLabel')}
                        onChange={(e) => {
                            localFeatured = e.currentTarget.checked;
                        }}
                    />
                    {localFeatured && (
                        <Group grow>
                            <TextInput
                                defaultValue={localRank}
                                label={t('course.detail.featured.modal.rankLabel')}
                                placeholder={t('course.detail.featured.modal.rankPlaceholder')}
                                onChange={(e) => {
                                    localRank = e.currentTarget.value;
                                }}
                            />
                            <TextInput
                                defaultValue={localBadge}
                                label={t('course.detail.featured.modal.badgeLabel')}
                                placeholder={t('course.detail.featured.modal.badgePlaceholder')}
                                onChange={(e) => {
                                    localBadge = e.currentTarget.value;
                                }}
                            />
                        </Group>
                    )}
                    <Group justify="flex-end" mt="sm">
                        <Button
                            size="sm"
                            onClick={() => {
                                if (!course.id) return;
                                const patch = localFeatured
                                    ? {
                                          is_featured: true,
                                          featured_rank: localRank ? Number(localRank) || 1 : 1,
                                          featured_badge_text: localBadge.trim() || t('course.detail.featured.modal.badgePlaceholder')
                                      }
                                    : { is_featured: false, featured_rank: undefined, featured_badge_text: undefined };
                                const updated = updateCoursePartial(course.id, patch);

                                if (updated) {
                                    notifications.show({ color: 'teal', title: t('course.detail.featured.modal.saveSuccessTitle'), message: t('course.detail.featured.modal.saveSuccessMessage') });
                                } else {
                                    notifications.show({ color: 'red', title: t('course.detail.featured.modal.saveErrorTitle'), message: t('course.detail.featured.modal.saveErrorMessage') });
                                }
                                modals.close('course-featured-modal');
                            }}
                        >
                            {t('common.save')}
                        </Button>
                        <Button size="sm" variant="default" onClick={() => modals.close('course-featured-modal')}>
                            {t('common.cancel')}
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
            title: t('course.detail.marketing.modal.title'),
            centered: true,
            modalId: 'course-marketing-modal',
            size: '800px',
            children: (
                <Stack gap="lg" mt="sm" style={{ maxWidth: 760 }}>
                    <Group grow style={{ alignItems: 'flex-start' }} wrap="nowrap">
                        <TextInput
                            defaultValue={localHeadline}
                            label={t('course.detail.marketing.modal.headlineLabel')}
                            maxLength={120}
                            placeholder={t('course.detail.marketing.modal.headlinePlaceholder')}
                            onChange={(e) => {
                                localHeadline = e.currentTarget.value;
                            }}
                        />
                    </Group>
                    <Textarea
                        autosize
                        defaultValue={localBody}
                        label={t('course.detail.marketing.modal.bodyLabel')}
                        maxLength={1200}
                        minRows={10}
                        placeholder={t('course.detail.marketing.modal.bodyPlaceholder')}
                        onChange={(e) => {
                            localBody = e.currentTarget.value;
                        }}
                    />
                    <Group justify="space-between" mt="sm">
                        <Text c="dimmed" size="sm">
                            {t('course.detail.marketing.modal.counter', { hCount: localHeadline.length, bCount: localBody.length })}
                        </Text>
                        <Group gap="xs">
                            <Button
                                size="sm"
                                onClick={() => {
                                    if (!course.id) return;
                                    const saved = upsertMarketingCopy(course.id, { headline: localHeadline.trim() || undefined, body_md: localBody.trim() || undefined });

                                    notifications.show({
                                        color: 'teal',
                                        message: saved.headline ? t('course.detail.marketing.modal.updateSuccessMessage') : t('course.detail.marketing.modal.clearedMessage'),
                                        title: t('course.detail.marketing.modal.updateSuccessTitle')
                                    });
                                    modals.close('course-marketing-modal');
                                }}
                            >
                                {t('common.save')}
                            </Button>
                            <Button size="sm" variant="default" onClick={() => modals.close('course-marketing-modal')}>
                                {t('common.cancel')}
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
                <EmptyState actionLabel={t('course.detail.empty.back')} message={t('course.detail.empty.message')} title={t('course.detail.empty.title')} to="/courses" />
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
            <Card withBorder mb="lg" p="md" radius="lg" shadow="sm">
                <TextTitle c="blue.6" fw={600} mb={8}>
                    {t('course.detail.preview.title')}
                </TextTitle>
                {embed}
                <TextBody c="dimmed" mt={8}>
                    {t('course.detail.preview.desc')}
                </TextBody>
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
                                {course.featured_badge_text || t('course.featuredDefault')}
                            </Badge>
                        )}
                    </Group>
                </Box>
                <Group gap={4} mt={8} wrap="nowrap">
                    {!course.is_active && (
                        <Badge color="red" mr={4} size="sm" variant="light">
                            {t('common.status.inactive')}
                        </Badge>
                    )}
                    {user?.role === 'admin' && (
                        <Tooltip withArrow label={t('course.featuredSet')}>
                            <ActionIcon aria-label={t('course.featuredSet')} color="teal" variant="subtle" w="100%" onClick={openFeaturedModal}>
                                <Award size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    {user?.role === 'admin' && (
                        <Tooltip withArrow label={t('course.marketingCopy')}>
                            <ActionIcon aria-label={t('course.marketingCopy')} color="grape" variant="subtle" w="100%" onClick={openMarketingModal}>
                                <ThumbsUp size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    {user && (user.role === 'instructor' || user.role === 'admin') && (
                        <Tooltip withArrow label={t('course.edit')}>
                            <ActionIcon
                                aria-label={t('course.edit')}
                                component={Link}
                                to={user.role === 'admin' ? `/admin/courses/${course.id}/edit` : `/instructor/courses/${course.id}/edit`}
                                variant="subtle"
                            >
                                <Pencil size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    {user?.role === 'admin' && (
                        <Tooltip withArrow label={course.is_active ? t('common.deactivate') : t('common.activate')}>
                            <ActionIcon
                                aria-label={course.is_active ? t('common.deactivate') : t('common.activate')}
                                color={course.is_active ? 'red' : 'teal'}
                                variant="subtle"
                                onClick={handleToggleActive}
                            >
                                {course.is_active ? <Trash2 size={16} /> : <Undo2 size={16} />}
                            </ActionIcon>
                        </Tooltip>
                    )}
                    {user && user.role === 'instructor' && (
                        <Tooltip withArrow label={t('course.createNew')}>
                            <ActionIcon aria-label={t('course.createNew')} color="green" component={Link} to="/instructor/courses/new" variant="subtle">
                                <Plus size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                    <Tooltip withArrow label={copied ? t('common.copied') : t('common.copyLink')}>
                        <ActionIcon aria-label={t('common.copyLink')} color={copied ? 'teal' : 'yellow'} variant="subtle" onClick={handleCopy}>
                            {copied ? <Copy size={16} /> : <Share2 size={16} />}
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
            {/* content grid */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                {/* 좌측: 썸네일/가격/수강신청 */}
                <Box>
                    <Card withBorder p="xl" radius="lg" shadow="sm">
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
                                    {t('course.detail.sidebar.enrolled')}
                                </Badge>
                            )}
                            {wish && (
                                <Badge color="pink" size="sm">
                                    {t('common.favorite.add')}
                                </Badge>
                            )}
                            {!enrolled && !wish && (
                                <TextMeta c="dimmed">
                                    {t('course.detail.sidebar.statusPrefix')} {t('course.detail.sidebar.notEnrolled')}
                                </TextMeta>
                            )}
                            <TextMeta c="yellow.7">★ 4.8</TextMeta>
                            <TextMeta c="dimmed">{t('course.detail.sidebar.studentsCount', { count: 1200 })}</TextMeta>
                        </Group>
                        <EnrollWishlistActions
                            enrolled={enrolled}
                            labels={{
                                enroll: t('course.detail.sidebar.enroll'),
                                loginRequired: t('course.detail.sidebar.loginRequired'),
                                wishAdd: t('common.favorite.add'),
                                wishRemove: t('common.favorite.remove')
                            }}
                            size="sm"
                            userId={userId}
                            wish={wish}
                            onEnroll={handleEnroll}
                            onStartLearning={handleStartLearning}
                            onToggleWish={handleWishlist}
                        />
                        <Button fullWidth component={Link} mt="sm" radius="md" size="sm" to="/courses" variant="default">
                            {t('course.detail.sidebar.backToList')}
                        </Button>
                    </Card>
                    {/* 강사 정보 */}
                    <Card withBorder mt="lg" p="lg" radius="lg" shadow="sm">
                        <Group align="center" gap={16}>
                            <Avatar radius="xl" size={56} src={''} />
                            <Box>
                                <Text fw={700} size="lg">
                                    {t('course.detail.instructor.nameSample')}
                                </Text>
                                <TextBody c="dimmed">{t('course.detail.instructor.profilePlaceholder')}</TextBody>
                            </Box>
                        </Group>
                    </Card>
                </Box>
                {/* 우측: 소개/강의 목차/후기/Q&A (용어 표준화) */}
                <Box>
                    <Tabs color="blue" defaultValue="desc">
                        <Tabs.List>
                            <Tabs.Tab value="desc">{t('course.detail.tabs.desc')}</Tabs.Tab>
                            <Tabs.Tab value="curriculum">{t('course.detail.tabs.curriculum')}</Tabs.Tab>
                            <Tabs.Tab value="reviews">{t('course.detail.tabs.reviews')}</Tabs.Tab>
                            <Tabs.Tab value="qna">{t('course.detail.tabs.qna')}</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panel pt="md" value="desc">
                            <MarkdownView source={course.description || ''} />
                            <Divider my="md" />
                            <TextBody c="dimmed">{course.summary}</TextBody>
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="curriculum">
                            {renderPreviewPlayer()}
                            {lessons.length === 0 && (
                                <Text c="dimmed" size="sm">
                                    {t('course.detail.curriculum.empty')}
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
                                                        {block.sectionIndex}. {block.header.title}
                                                    </Text>
                                                )}
                                                <Box
                                                    aria-label={t('course.detail.curriculum.blockAria', { outline: t('course.detail.tabs.curriculum'), index: bIndex + 1 })}
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
                                                                        window.alert(t('course.detail.curriculum.previewPlayAlert', { title: l.title }));
                                                                    }
                                                                }}
                                                            >
                                                                <TextMeta style={{ width: 42 }} ta="right">
                                                                    {block.sectionIndex ? `${block.sectionIndex}-${idx + 1}` : idx + 1}
                                                                </TextMeta>
                                                                <TextBody lineClamp={1} style={{ flex: 1, lineHeight: 1.35 }}>
                                                                    {l.title}
                                                                    {l.is_preview && (
                                                                        <Badge color="blue" ml={8} size="xs" variant="light">
                                                                            {t('course.detail.preview.title')}
                                                                        </Badge>
                                                                    )}
                                                                </TextBody>
                                                                <TextMeta style={{ width: 42 }} ta="right">
                                                                    {t('course.detail.curriculum.minutes', { mins })}
                                                                </TextMeta>
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
                            {course.id && (
                                <>
                                    <CourseReviewsSection
                                        courseId={course.id}
                                        data={reviewsPaged}
                                        enrolled={!!enrolled}
                                        sort={reviewsSort}
                                        userId={userId}
                                        onChangeSort={(s) => {
                                            setReviewsSort(s);
                                            setReviewsPage(1);
                                        }}
                                    />
                                    {reviewsPaged && reviewsPaged.pageCount > 1 && <PaginationBar page={reviewsPaged.page} totalPages={reviewsPaged.pageCount} onChange={(p) => setReviewsPage(p)} />}
                                </>
                            )}
                        </Tabs.Panel>
                        <Tabs.Panel pt="md" value="qna">
                            {course.id && (
                                <>
                                    <CourseQnASection courseId={course.id} data={qnaPaged} enrolled={!!enrolled} isInstructor={user?.role === 'instructor'} userId={userId} userRole={user?.role} />
                                    {qnaPaged && qnaPaged.pageCount > 1 && <PaginationBar page={qnaPaged.page} totalPages={qnaPaged.pageCount} onChange={(p) => setQnaPage(p)} />}
                                </>
                            )}
                        </Tabs.Panel>
                    </Tabs>
                </Box>
            </SimpleGrid>
            <PageSection withGapTop headingOrder={2} title={t('course.detail.marketingSection.sectionTitle')}>
                {marketingCopy?.headline || marketingCopy?.body_md ? (
                    <Card withBorder p="lg" radius="lg" shadow="sm">
                        {marketingCopy?.headline && (
                            <Text fw={700} mb={8} size="lg">
                                {marketingCopy.headline}
                            </Text>
                        )}
                        {marketingCopy?.body_md && <MarkdownView compact source={marketingCopy.body_md} />}
                        {!marketingCopy?.headline && !marketingCopy?.body_md && (
                            <Text c="dimmed" size="sm">
                                {t('course.detail.marketingSection.empty')}
                            </Text>
                        )}
                    </Card>
                ) : (
                    <Text c="dimmed" size="sm">
                        {t('course.detail.marketingSection.placeholder')}
                    </Text>
                )}
            </PageSection>
        </PageContainer>
    );
}

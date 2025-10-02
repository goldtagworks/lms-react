import { Anchor, Avatar, Badge, Button, Card, Divider, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useParams } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import { useAuth } from '@main/lib/auth';
import { ensureInstructorProfile, useInstructorProfile, upsertInstructorProfile, curateInstructorCourses } from '@main/lib/repository';
import CourseGrid from '@main/components/layout/CourseGrid';
import AppImage from '@main/components/AppImage';
import { useI18n } from '@main/lib/i18n';
import PriceText from '@main/components/price/PriceText';
import { TagChip } from '@main/components/TagChip';
import MarkdownViewer from '@main/components/MarkdownViewer';
import { Link as LinkIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import InstructorProfileEditModal from '@main/features/instructor/InstructorProfileEditModal';
import { Edit } from 'lucide-react';

const InstructorProfilePage = () => {
    const { id } = useParams();
    const instructorId = id || '';
    const { user } = useAuth();
    const canEdit = !!user && (user.role === 'admin' || user.id === instructorId);
    const profile = useInstructorProfile(instructorId);
    const [editOpen, setEditOpen] = useState(false);

    // 초기 프로필 보장 (승인된 강사 시나리오)
    const { t } = useI18n();

    useEffect(() => {
        if (instructorId) ensureInstructorProfile(instructorId, { display_name: t('instructor.edit.displayName') });
    }, [instructorId, t]);

    const curation = useMemo(() => curateInstructorCourses(instructorId, { limit: 4 }), [instructorId]);

    function handleSaveProfile(patch: { display_name: string; bio_md?: string }) {
        if (!instructorId) return;
        upsertInstructorProfile(instructorId, patch);
    }

    function hero() {
        if (!profile) {
            return (
                <Group align="flex-start" gap="lg" wrap="nowrap">
                    <Skeleton circle h={96} w={96} />
                    <Stack flex={1} gap={8}>
                        <Skeleton h={28} w="40%" />
                        <Skeleton h={16} w="70%" />
                        <Skeleton h={16} w="55%" />
                    </Stack>
                </Group>
            );
        }

        const initials = profile.display_name.slice(0, 2).toUpperCase();

        return (
            <Group align="flex-start" gap="lg" wrap="nowrap">
                <Avatar color="indigo" radius="md" size={96} variant="filled">
                    {initials}
                </Avatar>
                <Stack flex={1} gap={6}>
                    <Group gap={10}>
                        <Title order={2} size="h3">
                            {profile.display_name}
                        </Title>
                        <Badge color="grape" variant="light">
                            Instructor
                        </Badge>
                        {canEdit && (
                            <Button leftSection={<Edit size={14} />} size="sm" variant="subtle" onClick={() => setEditOpen(true)}>
                                {t('instructor.edit.title')}
                            </Button>
                        )}
                    </Group>
                    {/* 향후 서버 사전 계산 메트릭 (코스/레슨/총 시간) 주입 예정 - 클라이언트 계산 금지 정책 */}
                    <MarkdownViewer source={profile.bio_md} />
                    {profile.links && profile.links.length > 0 && (
                        <Group gap={10} mt={4} wrap="wrap">
                            <Group gap={4}>
                                <LinkIcon size={14} />
                                <Text fw={500} size="sm">
                                    Links
                                </Text>
                            </Group>
                            {profile.links.map((l, i) => (
                                <Anchor key={i} href={l.url} rel="noopener noreferrer" size="sm" target="_blank">
                                    {l.label}
                                </Anchor>
                            ))}
                        </Group>
                    )}
                </Stack>
            </Group>
        );
    }

    // t already from useI18n()

    return (
        <PageContainer roleMain py={48} size="lg">
            <Stack gap="xl">
                {hero()}
                <Divider label={t('instructor.profile.coursesDivider')} labelPosition="center" my="md" />
                {curation.allCount === 0 && (
                    <Card withBorder padding="lg" radius="lg">
                        <Text c="dimmed" size="sm">
                            {t('instructor.profile.emptyCourses')}
                        </Text>
                    </Card>
                )}
                {curation.allCount > 0 && (
                    <CourseGrid mt="md">
                        {/* featured 먼저, 이후 others */}
                        {curation.featured && (
                            <Card key={curation.featured.id} withBorder p="lg" radius="lg" shadow="sm">
                                <AppImage alt={curation.featured.title} height={140} mb={12} radius="lg" src={curation.featured.thumbnail_url || ''} />
                                <Group align="center" justify="space-between" mb={4} wrap="nowrap">
                                    <Text fw={700} size="md">
                                        {curation.featured.title}
                                    </Text>
                                    <Group gap={4}>
                                        {curation.featured.is_featured && (
                                            <Badge color="grape" size="xs" variant="filled">
                                                Featured
                                            </Badge>
                                        )}
                                    </Group>
                                </Group>
                                <Group gap={4} mb={4}>
                                    {curation.featured.tags?.slice(0, 4).map((tag) => (
                                        <TagChip key={tag} label={tag} />
                                    ))}
                                </Group>
                                {curation.featured.summary && (
                                    <Text c="dimmed" lineClamp={2} mb={6} size="sm">
                                        {curation.featured.summary}
                                    </Text>
                                )}
                                <PriceText discount={curation.featured.sale_price_cents ?? undefined} price={curation.featured.list_price_cents} />
                                <Button fullWidth component="a" href={`/course/${curation.featured.id}`} mt="sm" radius="md" size="sm" target="_blank" variant="light">
                                    {t('terms.viewDetails')}
                                </Button>
                            </Card>
                        )}
                        {curation.others.map((c) => (
                            <Card key={c.id} withBorder p="lg" radius="lg" shadow="sm">
                                <AppImage alt={c.title} height={140} mb={12} radius="lg" src={c.thumbnail_url || ''} />
                                <Group align="center" justify="space-between" mb={4} wrap="nowrap">
                                    <Text fw={600} size="md">
                                        {c.title}
                                    </Text>
                                    <Group gap={4}>
                                        {c.is_featured && (
                                            <Badge color="teal" size="xs" variant="light">
                                                {t('instructor.profile.featuredBadge')}
                                            </Badge>
                                        )}
                                    </Group>
                                </Group>
                                <Group gap={4} mb={4}>
                                    {c.tags?.slice(0, 4).map((tag) => (
                                        <TagChip key={tag} label={tag} />
                                    ))}
                                </Group>
                                {c.summary && (
                                    <Text c="dimmed" lineClamp={2} mb={6} size="sm">
                                        {c.summary}
                                    </Text>
                                )}
                                <PriceText discount={c.sale_price_cents ?? undefined} price={c.list_price_cents} />
                                <Button fullWidth component="a" href={`/course/${c.id}`} mt="sm" radius="md" size="sm" target="_blank" variant="light">
                                    {t('terms.viewDetails')}
                                </Button>
                            </Card>
                        ))}
                    </CourseGrid>
                )}
                {curation.allCount > (curation.featured ? 1 : 0) + curation.others.length && (
                    <Group justify="center" mt="md">
                        <Anchor href={`/courses?instructor=${instructorId}`} size="sm">
                            {t('instructor.profile.allCoursesLink', { count: curation.allCount })}
                        </Anchor>
                    </Group>
                )}
            </Stack>
            <InstructorProfileEditModal opened={editOpen} profile={profile || null} onClose={() => setEditOpen(false)} onSave={(p) => handleSaveProfile(p)} />
        </PageContainer>
    );
};

export default InstructorProfilePage;

import { Anchor, Avatar, Badge, Button, Card, Divider, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import { useParams } from 'react-router-dom';
import PageContainer from '@main/components/layout/PageContainer';
import { useAuth } from '@main/lib/auth';
import { ensureInstructorProfile, useInstructorProfile, upsertInstructorProfile, curateInstructorCourses, getInstructorLessonAggregates, formatDurationHM } from '@main/lib/repository';
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

    // 초기 프로필 보장 (승인된 강사 시나리오는 mock, 여기서는 단순 보장)
    useEffect(() => {
        if (instructorId) ensureInstructorProfile(instructorId, { display_name: '강사' });
    }, [instructorId]);

    const curation = useMemo(() => curateInstructorCourses(instructorId, { limit: 4 }), [instructorId]);
    const aggregates = useMemo(() => getInstructorLessonAggregates(instructorId), [instructorId]);

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
                            <Button leftSection={<Edit size={14} />} size="xs" variant="subtle" onClick={() => setEditOpen(true)}>
                                프로필 수정
                            </Button>
                        )}
                    </Group>
                    <Text c="dimmed" size="sm">
                        공개 강의 {curation.allCount}개 · 레슨 {aggregates.totalLessons}개 · 총 {formatDurationHM(aggregates.totalDurationSeconds)}
                    </Text>
                    <MarkdownViewer source={profile.bio_md} />
                    {profile.links && profile.links.length > 0 && (
                        <Group gap={10} mt={4} wrap="wrap">
                            <Group gap={4}>
                                <LinkIcon size={14} />
                                <Text fw={500} size="xs">
                                    Links
                                </Text>
                            </Group>
                            {profile.links.map((l, i) => (
                                <Anchor key={i} href={l.url} rel="noopener noreferrer" size="xs" target="_blank">
                                    {l.label}
                                </Anchor>
                            ))}
                        </Group>
                    )}
                </Stack>
            </Group>
        );
    }

    return (
        <PageContainer roleMain py={48} size="lg">
            <Stack gap="xl">
                {hero()}
                <Divider label="대표 강의" labelPosition="center" my="md" />
                <Stack gap="md">
                    {curation.allCount === 0 && (
                        <Card withBorder padding="lg" radius="md">
                            <Text c="dimmed" size="sm">
                                아직 공개된 강의가 없습니다.
                            </Text>
                        </Card>
                    )}
                    {curation.featured && (
                        <Card withBorder padding="md" radius="md" shadow="sm">
                            <Group align="flex-start" justify="space-between">
                                <Stack flex={1} gap={4}>
                                    <Group gap={8}>
                                        <Text fw={700}>{curation.featured.title}</Text>
                                        {curation.featured.is_featured && (
                                            <Badge color="grape" size="xs" variant="light">
                                                Featured
                                            </Badge>
                                        )}
                                    </Group>
                                    <Text c="dimmed" lineClamp={2} size="xs">
                                        {curation.featured.summary}
                                    </Text>
                                    <Group gap={6} mt={4}>
                                        {curation.featured.category && (
                                            <Badge color="blue" size="xs" variant="light">
                                                {curation.featured.category}
                                            </Badge>
                                        )}
                                        {(curation.featured.tags || []).slice(0, 3).map((t) => (
                                            <Badge key={t} color="gray" size="xs" variant="outline">
                                                {t}
                                            </Badge>
                                        ))}
                                    </Group>
                                </Stack>
                                <Stack align="flex-end" gap={6}>
                                    <Text c="dimmed" size="xs">
                                        ₩{curation.featured.price_cents.toLocaleString()}
                                    </Text>
                                    <Anchor href={`/course/${curation.featured.id}`} size="xs" target="_blank">
                                        상세 보기
                                    </Anchor>
                                </Stack>
                            </Group>
                        </Card>
                    )}
                </Stack>
                {curation.others.length > 0 && <Divider label="다른 강의" labelPosition="center" my="lg" />}
                {curation.others.length > 0 && (
                    <Stack gap="md">
                        {curation.others.map((c) => (
                            <Card key={c.id} withBorder padding="md" radius="md">
                                <Group align="flex-start" justify="space-between">
                                    <Stack flex={1} gap={4}>
                                        <Text fw={600}>{c.title}</Text>
                                        <Text c="dimmed" lineClamp={2} size="xs">
                                            {c.summary}
                                        </Text>
                                        <Group gap={6} mt={4}>
                                            {c.category && (
                                                <Badge color="blue" size="xs" variant="light">
                                                    {c.category}
                                                </Badge>
                                            )}
                                            {(c.tags || []).slice(0, 3).map((t) => (
                                                <Badge key={t} color="gray" size="xs" variant="outline">
                                                    {t}
                                                </Badge>
                                            ))}
                                        </Group>
                                    </Stack>
                                    <Stack align="flex-end" gap={6}>
                                        <Text c="dimmed" size="xs">
                                            ₩{c.price_cents.toLocaleString()}
                                        </Text>
                                        <Anchor href={`/course/${c.id}`} size="xs" target="_blank">
                                            상세 보기
                                        </Anchor>
                                    </Stack>
                                </Group>
                            </Card>
                        ))}
                    </Stack>
                )}
                {curation.allCount > (curation.featured ? 1 : 0) + curation.others.length && (
                    <Group justify="center" mt="md">
                        <Anchor href={`/courses?instructor=${instructorId}`} size="sm">
                            전체 강의 보기 ({curation.allCount}개)
                        </Anchor>
                    </Group>
                )}
            </Stack>
            <InstructorProfileEditModal opened={editOpen} profile={profile || null} onClose={() => setEditOpen(false)} onSave={(p) => handleSaveProfile(p)} />
        </PageContainer>
    );
};

export default InstructorProfilePage;

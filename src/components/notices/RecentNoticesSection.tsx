import type { Tables } from '@main/types/database';

import { useQuery } from '@tanstack/react-query';
import { supabasePublic } from '@main/lib/supabase';
import { mapSupabaseError } from '@main/lib/errors';
import PageSection from '@main/components/layout/PageSection';
import { Badge, Card, Group, Stack, Text, Anchor } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';
import { Link } from 'react-router-dom';
import { formatDate } from '@main/utils/format';

interface Props {
    limit?: number;
}

export function RecentNoticesSection({ limit = 2 }: Props) {
    const { t } = useI18n();

    const query = useQuery<Tables<'notices'>[]>({
        queryKey: ['notices', 'recent', { limit }],
        staleTime: 300_000, // 5분 캐시 (공지 빈도 낮음)
        retry: 1,
        refetchOnWindowFocus: false,
        queryFn: async () => {
            const { data, error } = await supabasePublic
                .from('notices')
                .select('id,title,body,pinned,created_at')
                .eq('published', true)
                .order('pinned', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw mapSupabaseError(error);

            return (data as Tables<'notices'>[] | null) || [];
        }
    });

    const notices = query.data || [];

    // 로딩 Skeleton (레이아웃 안정)
    if (query.isLoading) {
        return (
            <PageSection withGapTop title={t('notice.list')}>
                <Stack gap="sm">
                    {Array.from({ length: limit }).map((_, i) => (
                        <Card key={i} withBorder p="sm" radius="lg" shadow="xs">
                            <Stack gap={4}>
                                <div style={{ height: 12, background: 'light-dark(var(--mantine-color-gray-3), var(--mantine-color-gray-7))', borderRadius: 4, width: '70%' }} />
                                <div style={{ height: 10, background: 'light-dark(var(--mantine-color-gray-2), var(--mantine-color-gray-8))', borderRadius: 4, width: '40%' }} />
                            </Stack>
                        </Card>
                    ))}
                </Stack>
            </PageSection>
        );
    }

    // 에러 UI (조용한 실패 표시)
    if (query.isError) {
        return (
            <PageSection withGapTop title={t('notice.list')}>
                <Text c="dimmed" size="xs">
                    {t('common.fetchError') || '일시적으로 공지를 불러오지 못했습니다.'}
                </Text>
            </PageSection>
        );
    }

    if (notices.length === 0) return null; // 비어있으면 섹션 자체 미노출 (홈 단순화)

    return (
        <PageSection withGapTop title={t('notice.list')}>
            <Stack gap="sm">
                {notices.map((n) => (
                    <Card key={n.id} withBorder aria-label={n.title} component={Link} p="sm" radius="lg" shadow="sm" to={`/notices/${n.id}`}>
                        <Group gap="xs" justify="space-between" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap">
                                {n.pinned && (
                                    <Badge color="red" size="sm" variant="light">
                                        {t('notice.badgePinned')}
                                    </Badge>
                                )}
                                <Text fw={500} lineClamp={1} size="sm">
                                    {n.title}
                                </Text>
                            </Group>
                            <Text c="dimmed" size="sm">
                                {formatDate(n.created_at)}
                            </Text>
                        </Group>
                    </Card>
                ))}
                <Anchor aria-label={t('notice.viewAllAria')} component={Link} size="sm" to="/notices">
                    {t('notice.viewAll')} →
                </Anchor>
            </Stack>
        </PageSection>
    );
}

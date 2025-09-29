import { listNotices } from '@main/lib/noticeRepo';
import PageSection from '@main/components/layout/PageSection';
import { Badge, Card, Group, Stack, Text, Anchor } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';
import { Link } from 'react-router-dom';
import { formatDate } from '@main/utils/format';

interface Props {
    limit?: number;
}

export function RecentNoticesSection({ limit = 2 }: Props) {
    const notices = listNotices().slice(0, limit);
    const { t } = useI18n();

    if (notices.length === 0) return null;

    return (
        <PageSection withGapTop title={t('notice.list')}>
            <Stack gap="sm">
                {notices.map((n) => (
                    <Card key={n.id} withBorder aria-label={n.title} component={Link} p="sm" radius="md" shadow="sm" to={`/notices/${n.id}`}>
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

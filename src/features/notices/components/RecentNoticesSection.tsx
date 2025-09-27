import { listNotices } from '@main/lib/noticeRepo';
import PageSection from '@main/components/layout/PageSection';
import { Badge, Card, Group, Stack, Text, Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';
import { formatDate } from '@main/utils/format';

interface Props {
    limit?: number;
}

export function RecentNoticesSection({ limit = 2 }: Props) {
    const notices = listNotices().slice(0, limit);

    if (notices.length === 0) return null;

    return (
        <PageSection withGapTop title="공지사항">
            <Stack gap="sm">
                {notices.map((n) => (
                    <Card key={n.id} withBorder aria-label={n.title} component={Link} p="sm" radius="md" shadow="xs" to={`/notices/${n.id}`}>
                        <Group gap="xs" justify="space-between" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap">
                                {n.pinned && (
                                    <Badge color="red" size="sm" variant="light">
                                        PIN
                                    </Badge>
                                )}
                                <Text fw={500} lineClamp={1} size="sm">
                                    {n.title}
                                </Text>
                            </Group>
                            <Text c="dimmed" size="xs">
                                {formatDate(n.created_at)}
                            </Text>
                        </Group>
                    </Card>
                ))}
                <Anchor aria-label="공지사항 전체 보기" component={Link} size="sm" to="/notices">
                    전체 보기 →
                </Anchor>
            </Stack>
        </PageSection>
    );
}

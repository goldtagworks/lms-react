import { Card, Stack, Group, Text, Badge } from '@mantine/core';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PaginationBar from '@main/components/PaginationBar';
import { useState } from 'react';
import { useI18n } from '@main/lib/i18n';
import { useSupportTicketsPaged } from '@main/features/support/hooks';

/** 임시 데모 페이지: Support 티켓 페이지네이션 UI (실제 라우터 연결 전) */
export default function SupportTicketsPage() {
    const { t } = useI18n();
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const { data } = useSupportTicketsPaged(page, pageSize);

    return (
        <PageContainer roleMain py={48} size="lg">
            <PageHeader description={t('support.listDescription')} title={t('support.title')} />
            <Stack gap="md">
                {data && data.items.length === 0 && <Text c="dimmed">{t('support.empty')}</Text>}
                {data &&
                    data.items.map((tkt) => (
                        <Card key={tkt.id} withBorder p="md" radius="lg">
                            <Group justify="space-between" mb={4}>
                                <Text fw={600}>{tkt.title}</Text>
                                <Badge color={tkt.status === 'CLOSED' ? 'gray' : tkt.status === 'ANSWERED' ? 'teal' : 'indigo'} size="sm" variant="light">
                                    {tkt.status}
                                </Badge>
                            </Group>
                            <Text c="dimmed" size="xs">
                                {t('support.lastMessageAt')}: {new Date(tkt.last_message_at).toLocaleString()}
                            </Text>
                        </Card>
                    ))}
                {data && <PaginationBar page={data.page} totalPages={data.pageCount} onChange={setPage} />}
            </Stack>
        </PageContainer>
    );
}

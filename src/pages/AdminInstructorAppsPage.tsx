import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Group, Stack, Table, Textarea, Modal, Tabs, TextInput, ActionIcon, Tooltip, Divider } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import { notifications } from '@mantine/notifications';
import { approveInstructorApplication, rejectInstructorApplication, revokeInstructorApplication, useInstructorApplications } from '@main/lib/repository';
import InstructorAppDetail from '@main/components/instructors/InstructorAppDetail';
import { Search, XCircle, CheckCircle2, Clock, Check, X, ShieldAlert } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import PaginationBar from '@main/components/PaginationBar';
import PageHeader from '@main/components/layout/PageHeader';
import { useI18n } from '@main/lib/i18n';

const statusColor: Record<string, string> = {
    PENDING: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
    REVOKED: 'gray'
};

export default function AdminInstructorAppsPage() {
    const { t } = useI18n();
    const apps = useInstructorApplications();
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [detailId, setDetailId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'DECIDED' | 'REVOKED'>('PENDING');
    const [pendingPage, setPendingPage] = useState(1);
    const [decidedPage, setDecidedPage] = useState(1);
    const [revokedPage, setRevokedPage] = useState(1);
    const [search, setSearch] = useState('');
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [revokeReason, setRevokeReason] = useState('');
    const pageSize = 10;

    const pendingAll = useMemo(() => apps.filter((a) => a.status === 'PENDING'), [apps]);
    const decidedAll = useMemo(() => apps.filter((a) => a.status !== 'PENDING' && a.status !== 'REVOKED'), [apps]); // APPROVED/REJECTED
    const revokedAll = useMemo(() => apps.filter((a) => a.status === 'REVOKED'), [apps]);
    const revokedCount = useMemo(() => apps.filter((a) => a.status === 'REVOKED').length, [apps]);

    const filteredPending = useMemo(
        () =>
            pendingAll.filter((a) => {
                if (!search.trim()) return true;
                const q = search.toLowerCase();

                return a.display_name.toLowerCase().includes(q) || a.user_id.toLowerCase().includes(q);
            }),
        [pendingAll, search]
    );
    const filteredDecided = useMemo(
        () =>
            decidedAll.filter((a) => {
                if (!search.trim()) return true;
                const q = search.toLowerCase();

                return a.display_name.toLowerCase().includes(q) || a.user_id.toLowerCase().includes(q);
            }),
        [decidedAll, search]
    );
    const filteredRevoked = useMemo(
        () =>
            revokedAll.filter((a) => {
                if (!search.trim()) return true;
                const q = search.toLowerCase();

                return a.display_name.toLowerCase().includes(q) || a.user_id.toLowerCase().includes(q);
            }),
        [revokedAll, search]
    );
    const pending = filteredPending.slice((pendingPage - 1) * pageSize, pendingPage * pageSize);
    const decided = filteredDecided.slice((decidedPage - 1) * pageSize, decidedPage * pageSize);
    const revoked = filteredRevoked.slice((revokedPage - 1) * pageSize, revokedPage * pageSize);

    function approve(id: string) {
        approveInstructorApplication(id);

        const app = apps.find((a) => a.id === id);

        if (app) {
            notifications.show({ color: 'teal', title: t('notify.success.approve'), message: t('admin.instructorApps.notify.approved', { name: app.display_name }) });
        }
    }
    function openReject(id: string) {
        setRejectingId(id);
    }
    function submitReject() {
        if (rejectingId) {
            rejectInstructorApplication(rejectingId, reason.trim() || undefined);

            const app = apps.find((a) => a.id === rejectingId);

            if (app) {
                notifications.show({ color: 'red', title: t('notify.success.reject'), message: t('admin.instructorApps.notify.rejected', { name: app.display_name }) });
            }
            setRejectingId(null);
            setReason('');
        }
    }
    function confirmRevoke() {
        if (!revokingId) return;
        revokeInstructorApplication(revokingId, revokeReason.trim() || undefined);

        const app = apps.find((a) => a.id === revokingId);

        if (app) {
            notifications.show({ color: 'gray', title: t('notify.success.revoke'), message: t('admin.instructorApps.notify.revoked', { name: app.display_name }) });
        }
        setRevokingId(null);
        setRevokeReason('');
        setActiveTab('REVOKED');
    }
    function openRevoke(id: string) {
        setRevokingId(id);
        setRevokeReason('');
    }
    // 필터/탭 결과 변화 시 현재 page가 totalPages를 초과하면 마지막 페이지로 보정
    useEffect(() => {
        const pendTotalPages = Math.max(1, Math.ceil(filteredPending.length / pageSize));

        if (pendingPage > pendTotalPages) setPendingPage(pendTotalPages);
    }, [filteredPending.length, pendingPage]);
    useEffect(() => {
        const decTotalPages = Math.max(1, Math.ceil(filteredDecided.length / pageSize));

        if (decidedPage > decTotalPages) setDecidedPage(decTotalPages);
    }, [filteredDecided.length, decidedPage]);
    useEffect(() => {
        const revTotalPages = Math.max(1, Math.ceil(filteredRevoked.length / pageSize));

        if (revokedPage > revTotalPages) setRevokedPage(revTotalPages);
    }, [filteredRevoked.length, revokedPage]);

    return (
        <PageContainer roleMain>
            <PageHeader
                actions={
                    <Group gap={6} wrap="wrap">
                        <Badge color="grape" leftSection={<Clock size={12} />}>
                            {t('common.status.pending')} {pendingAll.length}
                        </Badge>
                        <Badge color="teal" leftSection={<Check size={12} />}>
                            {t('common.status.approved')} {decidedAll.filter((a) => a.status === 'APPROVED').length}
                        </Badge>
                        <Badge color="red" leftSection={<X size={12} />}>
                            {t('common.status.rejected')} {decidedAll.filter((a) => a.status === 'REJECTED').length}
                        </Badge>
                        <Badge color="gray" leftSection={<ShieldAlert size={12} />}>
                            {t('common.status.revoked')} {revokedCount}
                        </Badge>
                        <Badge color="gray" variant="outline">
                            {t('common.total')} {apps.length}
                        </Badge>
                    </Group>
                }
                description={t('admin.instructorApps.description')}
                title={t('admin.instructorApps.title')}
            />

            <Divider mb="md" />

            <Stack gap="sm">
                <Group align="flex-end" justify="space-between">
                    <Tabs keepMounted={false} value={activeTab} onChange={(v) => setActiveTab((v as 'PENDING' | 'DECIDED' | 'REVOKED') || 'PENDING')}>
                        <Tabs.List>
                            <Tabs.Tab value="PENDING">
                                {t('admin.instructorApps.tabs.pending')} ({filteredPending.length})
                            </Tabs.Tab>
                            <Tabs.Tab value="DECIDED">
                                {t('admin.instructorApps.tabs.decided')} ({filteredDecided.length})
                            </Tabs.Tab>
                            <Tabs.Tab value="REVOKED">
                                {t('admin.instructorApps.tabs.revoked')} ({filteredRevoked.length})
                            </Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                    <TextInput
                        aria-label={t('a11y.admin.instructorAppsSearch')}
                        leftSection={<Search size={14} />}
                        placeholder={t('admin.instructorApps.searchPlaceholder')}
                        radius="md"
                        size="sm"
                        value={search}
                        w={260}
                        onChange={(e) => {
                            setSearch(e.currentTarget.value);
                            setPendingPage(1);
                            setDecidedPage(1);
                            setRevokedPage(1);
                        }}
                    />
                </Group>

                {activeTab === 'PENDING' && (
                    <Stack gap="xs">
                        <Table striped withColumnBorders withTableBorder horizontalSpacing="sm" verticalSpacing="xs">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{ width: 140 }} ta="center">
                                        {t('admin.instructorApps.table.user')}
                                    </Table.Th>
                                    <Table.Th style={{ width: 170 }} ta="center">
                                        {t('admin.instructorApps.table.displayName')}
                                    </Table.Th>
                                    <Table.Th ta="center">{t('admin.instructorApps.table.links')}</Table.Th>
                                    <Table.Th style={{ width: 110 }} ta="center">
                                        {t('admin.instructorApps.table.appliedAt')}
                                    </Table.Th>
                                    <Table.Th style={{ width: 120 }} ta="center">
                                        {t('admin.instructorApps.table.actions')}
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {pending.map((a) => {
                                    const linkLabels = a.links?.map((l) => l.label).join(', ');

                                    return (
                                        <Table.Tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setDetailId(a.id)}>
                                            <Table.Td>
                                                <TextBody fw={500} lineClamp={1} sizeOverride="sm" title={a.user_id}>
                                                    {a.user_id}
                                                </TextBody>
                                            </Table.Td>
                                            <Table.Td>
                                                <TextBody fw={500} lineClamp={1} sizeOverride="sm" title={a.display_name}>
                                                    {a.display_name}
                                                </TextBody>
                                            </Table.Td>
                                            <Table.Td>
                                                <TextMeta lineClamp={1} title={linkLabels}>
                                                    {linkLabels || '-'}
                                                </TextMeta>
                                            </Table.Td>
                                            <Table.Td>
                                                <TextMeta>{a.created_at.slice(0, 10)}</TextMeta>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4} justify="center">
                                                    <Tooltip withArrow label={t('admin.instructorApps.tooltip.approve')}>
                                                        <ActionIcon
                                                            color="teal"
                                                            size="sm"
                                                            variant="light"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                approve(a.id);
                                                            }}
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip withArrow label={t('admin.instructorApps.tooltip.reject')}>
                                                        <ActionIcon
                                                            color="red"
                                                            size="sm"
                                                            variant="light"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openReject(a.id);
                                                            }}
                                                        >
                                                            <XCircle size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                                {pending.length === 0 && (
                                    <Table.Tr>
                                        <Table.Td colSpan={5}>
                                            <TextMeta py={20} ta="center">
                                                {t('admin.instructorApps.empty.pending')}
                                            </TextMeta>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                        <PaginationBar align="right" page={pendingPage} size="sm" totalPages={Math.max(1, Math.ceil(filteredPending.length / pageSize))} onChange={setPendingPage} />
                    </Stack>
                )}
                {activeTab === 'DECIDED' && (
                    <Stack gap="xs">
                        <Table withColumnBorders withTableBorder horizontalSpacing="sm" verticalSpacing="xs">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{ width: 180 }} ta="center">
                                        {t('admin.instructorApps.table.displayName')}
                                    </Table.Th>
                                    <Table.Th style={{ width: 110 }} ta="center">
                                        {t('admin.instructorApps.table.status')}
                                    </Table.Th>
                                    <Table.Th style={{ width: 110 }} ta="center">
                                        {t('admin.instructorApps.table.decidedAt')}
                                    </Table.Th>
                                    <Table.Th ta="center">{t('admin.instructorApps.table.note')}</Table.Th>
                                    <Table.Th style={{ width: 80 }} ta="center">
                                        {t('admin.instructorApps.table.actions')}
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {decided.map((a) => (
                                    <Table.Tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setDetailId(a.id)}>
                                        <Table.Td>
                                            <TextBody fw={500} lineClamp={1} sizeOverride="sm" title={a.display_name}>
                                                {a.display_name}
                                            </TextBody>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={statusColor[a.status]} size="sm" variant="light">
                                                {a.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <TextMeta>{a.decided_at?.slice(0, 10) || '-'}</TextMeta>
                                        </Table.Td>
                                        <Table.Td>
                                            {(() => {
                                                const note = a.status === 'REJECTED' ? a.rejection_reason : undefined;

                                                return (
                                                    <TextMeta lineClamp={1} title={note || ''}>
                                                        {note || '-'}
                                                    </TextMeta>
                                                );
                                            })()}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4} justify="center">
                                                {a.status === 'APPROVED' && (
                                                    <Tooltip withArrow label={t('admin.instructorApps.tooltip.revoke')}>
                                                        <ActionIcon
                                                            color="gray"
                                                            size="sm"
                                                            variant="light"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openRevoke(a.id);
                                                            }}
                                                        >
                                                            <ShieldAlert size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                                {decided.length === 0 && (
                                    <Table.Tr>
                                        <Table.Td colSpan={5}>
                                            <TextMeta py={20} ta="center">
                                                {t('admin.instructorApps.empty.decided')}
                                            </TextMeta>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                        <PaginationBar align="right" page={decidedPage} size="sm" totalPages={Math.max(1, Math.ceil(filteredDecided.length / pageSize))} onChange={setDecidedPage} />
                    </Stack>
                )}
                {activeTab === 'REVOKED' && (
                    <Stack gap="xs">
                        <Table withColumnBorders withTableBorder horizontalSpacing="sm" verticalSpacing="xs">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{ width: 180 }} ta="center">
                                        {t('admin.instructorApps.table.displayName')}
                                    </Table.Th>
                                    <Table.Th style={{ width: 110 }} ta="center">
                                        {t('admin.instructorApps.table.revokedAt')}
                                    </Table.Th>
                                    <Table.Th ta="center">{t('admin.instructorApps.table.reason')}</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {revoked.map((a) => (
                                    <Table.Tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setDetailId(a.id)}>
                                        <Table.Td>
                                            <TextBody fw={500} lineClamp={1} sizeOverride="sm" title={a.display_name}>
                                                {a.display_name}
                                            </TextBody>
                                        </Table.Td>
                                        <Table.Td>
                                            <TextMeta>{a.revoked_at?.slice(0, 10) || '-'}</TextMeta>
                                        </Table.Td>
                                        <Table.Td>
                                            <TextMeta lineClamp={1} title={a.revoke_reason || ''}>
                                                {a.revoke_reason || '-'}
                                            </TextMeta>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                                {revoked.length === 0 && (
                                    <Table.Tr>
                                        <Table.Td colSpan={3}>
                                            <TextMeta py={20} ta="center">
                                                {t('admin.instructorApps.empty.revoked')}
                                            </TextMeta>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                        <PaginationBar align="right" page={revokedPage} size="sm" totalPages={Math.max(1, Math.ceil(filteredRevoked.length / pageSize))} onChange={setRevokedPage} />
                    </Stack>
                )}
            </Stack>

            <Modal centered opened={!!detailId} radius="md" size="lg" title={t('admin.instructorApps.modal.detailTitle')} onClose={() => setDetailId(null)}>
                {detailId && <InstructorAppDetail appId={detailId} onClose={() => setDetailId(null)} />}
            </Modal>
            <Modal centered opened={!!rejectingId} radius="md" title={t('admin.instructorApps.modal.rejectTitle')} onClose={() => setRejectingId(null)}>
                <Stack>
                    <Textarea minRows={3} placeholder={t('admin.instructorApps.modal.rejectReasonPlaceholder')} value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
                    <Group justify="flex-end">
                        <Button color="red" leftSection={<XCircle size={14} />} size="sm" onClick={submitReject}>
                            {t('common.reject')} {t('common.confirm')}
                        </Button>
                        <Button leftSection={<CheckCircle2 size={14} />} size="sm" variant="default" onClick={() => setRejectingId(null)}>
                            {t('common.cancel')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Modal centered opened={!!revokingId} radius="md" title={t('admin.instructorApps.modal.revokeTitle')} onClose={() => setRevokingId(null)}>
                <Stack>
                    <TextBody c="dimmed">{t('admin.instructorApps.modal.revokeInfo')}</TextBody>
                    <Textarea minRows={3} placeholder={t('admin.instructorApps.modal.revokeReasonPlaceholder')} value={revokeReason} onChange={(e) => setRevokeReason(e.currentTarget.value)} />
                    <Group justify="flex-end">
                        <Button color="gray" leftSection={<ShieldAlert size={14} />} size="sm" onClick={confirmRevoke}>
                            {t('common.revoke')} {t('common.confirm')}
                        </Button>
                        <Button leftSection={<CheckCircle2 size={14} />} size="sm" variant="default" onClick={() => setRevokingId(null)}>
                            {t('common.cancel')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </PageContainer>
    );
}

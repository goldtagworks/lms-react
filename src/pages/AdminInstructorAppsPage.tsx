import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Group, Stack, Table, Text, Textarea, Modal, Tabs, TextInput, ActionIcon, Tooltip, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { approveInstructorApplication, rejectInstructorApplication, revokeInstructorApplication, useInstructorApplications } from '@main/lib/repository';
import InstructorAppDetail from '@main/components/instructors/InstructorAppDetail';
import { Search, XCircle, CheckCircle2, Clock, Check, X, ShieldAlert } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import PaginationBar from '@main/components/PaginationBar';
import PageHeader from '@main/components/layout/PageHeader';

const statusColor: Record<string, string> = {
    PENDING: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
    REVOKED: 'gray'
};

export default function AdminInstructorAppsPage() {
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
            notifications.show({ color: 'teal', title: '승인 완료', message: `${app.display_name} 승인됨` });
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
                notifications.show({ color: 'red', title: '반려 처리', message: `${app.display_name} 반려됨` });
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
            notifications.show({ color: 'gray', title: '권한 회수', message: `${app.display_name} 강사 권한 회수` });
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
                            대기 {pendingAll.length}
                        </Badge>
                        <Badge color="teal" leftSection={<Check size={12} />}>
                            승인 {decidedAll.filter((a) => a.status === 'APPROVED').length}
                        </Badge>
                        <Badge color="red" leftSection={<X size={12} />}>
                            반려 {decidedAll.filter((a) => a.status === 'REJECTED').length}
                        </Badge>
                        <Badge color="gray" leftSection={<ShieldAlert size={12} />}>
                            회수 {revokedCount}
                        </Badge>
                        <Badge color="gray" variant="outline">
                            총 {apps.length}
                        </Badge>
                    </Group>
                }
                description="강사 신청을 검토/승인/반려/회수 관리합니다."
                title="강사 신청 관리"
            />

            <Divider mb="md" />

            <Stack gap="sm">
                <Group align="flex-end" justify="space-between">
                    <Tabs keepMounted={false} value={activeTab} onChange={(v) => setActiveTab((v as 'PENDING' | 'DECIDED' | 'REVOKED') || 'PENDING')}>
                        <Tabs.List>
                            <Tabs.Tab value="PENDING">대기중 ({filteredPending.length})</Tabs.Tab>
                            <Tabs.Tab value="DECIDED">승인 / 반려 ({filteredDecided.length})</Tabs.Tab>
                            <Tabs.Tab value="REVOKED">회수 ({filteredRevoked.length})</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>
                    <TextInput
                        leftSection={<Search size={14} />}
                        placeholder="검색: 사용자/표시 이름"
                        radius="md"
                        size="xs"
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
                                        사용자
                                    </Table.Th>
                                    <Table.Th style={{ width: 170 }} ta="center">
                                        표시 이름
                                    </Table.Th>
                                    <Table.Th ta="center">링크</Table.Th>
                                    <Table.Th style={{ width: 110 }} ta="center">
                                        신청일
                                    </Table.Th>
                                    <Table.Th style={{ width: 120 }} ta="center">
                                        관리
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {pending.map((a) => {
                                    const linkLabels = a.links?.map((l) => l.label).join(', ');

                                    return (
                                        <Table.Tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setDetailId(a.id)}>
                                            <Table.Td>
                                                <Text fw={500} lineClamp={1} size="xs" title={a.user_id}>
                                                    {a.user_id}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text fw={500} lineClamp={1} size="sm" title={a.display_name}>
                                                    {a.display_name}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text c="dimmed" lineClamp={1} size="xs" title={linkLabels}>
                                                    {linkLabels || '-'}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs">{a.created_at.slice(0, 10)}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4} justify="center">
                                                    <Tooltip withArrow label="승인">
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
                                                    <Tooltip withArrow label="반려">
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
                                            <Text c="dimmed" py={20} size="sm" ta="center">
                                                대기중 신청이 없습니다.
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                        <PaginationBar align="right" page={pendingPage} size="xs" totalPages={Math.max(1, Math.ceil(filteredPending.length / pageSize))} onChange={setPendingPage} />
                    </Stack>
                )}
                {activeTab === 'DECIDED' && (
                    <Stack gap="xs">
                        <Table withColumnBorders withTableBorder horizontalSpacing="sm" verticalSpacing="xs">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{ width: 180 }} ta="center">
                                        표시 이름
                                    </Table.Th>
                                    <Table.Th style={{ width: 110 }} ta="center">
                                        상태
                                    </Table.Th>
                                    <Table.Th style={{ width: 110 }} ta="center">
                                        결정일
                                    </Table.Th>
                                    <Table.Th ta="center">비고</Table.Th>
                                    <Table.Th style={{ width: 80 }} ta="center">
                                        관리
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {decided.map((a) => (
                                    <Table.Tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setDetailId(a.id)}>
                                        <Table.Td>
                                            <Text fw={500} lineClamp={1} size="sm" title={a.display_name}>
                                                {a.display_name}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge color={statusColor[a.status]} size="sm" variant="light">
                                                {a.status}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs">{a.decided_at?.slice(0, 10) || '-'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {(() => {
                                                const note = a.status === 'REJECTED' ? a.rejection_reason : undefined;

                                                return (
                                                    <Text c="dimmed" lineClamp={1} size="xs" title={note || ''}>
                                                        {note || '-'}
                                                    </Text>
                                                );
                                            })()}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={4} justify="center">
                                                {a.status === 'APPROVED' && (
                                                    <Tooltip withArrow label="권한 회수">
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
                                            <Text c="dimmed" py={20} size="sm" ta="center">
                                                완료된 신청이 없습니다.
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                        <PaginationBar align="right" page={decidedPage} size="xs" totalPages={Math.max(1, Math.ceil(filteredDecided.length / pageSize))} onChange={setDecidedPage} />
                    </Stack>
                )}
                {activeTab === 'REVOKED' && (
                    <Stack gap="xs">
                        <Table withColumnBorders withTableBorder horizontalSpacing="sm" verticalSpacing="xs">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th style={{ width: 180 }} ta="center">
                                        표시 이름
                                    </Table.Th>
                                    <Table.Th style={{ width: 110 }} ta="center">
                                        회수일
                                    </Table.Th>
                                    <Table.Th ta="center">사유</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {revoked.map((a) => (
                                    <Table.Tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setDetailId(a.id)}>
                                        <Table.Td>
                                            <Text fw={500} lineClamp={1} size="sm" title={a.display_name}>
                                                {a.display_name}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="xs">{a.revoked_at?.slice(0, 10) || '-'}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text c="dimmed" lineClamp={1} size="xs" title={a.revoke_reason || ''}>
                                                {a.revoke_reason || '-'}
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                                {revoked.length === 0 && (
                                    <Table.Tr>
                                        <Table.Td colSpan={3}>
                                            <Text c="dimmed" py={20} size="sm" ta="center">
                                                회수된 신청이 없습니다.
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                )}
                            </Table.Tbody>
                        </Table>
                        <PaginationBar align="right" page={revokedPage} size="xs" totalPages={Math.max(1, Math.ceil(filteredRevoked.length / pageSize))} onChange={setRevokedPage} />
                    </Stack>
                )}
            </Stack>

            <Modal centered opened={!!detailId} radius="md" size="lg" title="강사 신청 상세" onClose={() => setDetailId(null)}>
                {detailId && <InstructorAppDetail appId={detailId} onClose={() => setDetailId(null)} />}
            </Modal>
            <Modal centered opened={!!rejectingId} radius="md" title="반려 사유" onClose={() => setRejectingId(null)}>
                <Stack>
                    <Textarea minRows={3} placeholder="사유 (선택)" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
                    <Group justify="flex-end">
                        <Button color="red" leftSection={<XCircle size={14} />} size="xs" onClick={submitReject}>
                            반려 확정
                        </Button>
                        <Button leftSection={<CheckCircle2 size={14} />} size="xs" variant="default" onClick={() => setRejectingId(null)}>
                            취소
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Modal centered opened={!!revokingId} radius="md" title="강사 권한 회수" onClose={() => setRevokingId(null)}>
                <Stack>
                    <Text c="dimmed" size="sm">
                        승인된 강사의 권한을 회수합니다. 이미 생성된 코스 처리 등은 후속 정책에 따릅니다.
                    </Text>
                    <Textarea minRows={3} placeholder="회수 사유 (선택) - 예: 부적절한 콘텐츠, 정책 위반" value={revokeReason} onChange={(e) => setRevokeReason(e.currentTarget.value)} />
                    <Group justify="flex-end">
                        <Button color="gray" leftSection={<ShieldAlert size={14} />} size="xs" onClick={confirmRevoke}>
                            회수 확정
                        </Button>
                        <Button leftSection={<CheckCircle2 size={14} />} size="xs" variant="default" onClick={() => setRevokingId(null)}>
                            취소
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </PageContainer>
    );
}

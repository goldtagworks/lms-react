import { useState } from 'react';
import { Badge, Button, Card, Group, Stack, Table, Text, Textarea, Modal } from '@mantine/core';
import { approveInstructorApplication, rejectInstructorApplication, useInstructorApplications } from '@main/lib/repository';

const statusColor: Record<string, string> = {
    PENDING: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red'
};

export default function AdminInstructorAppsPage() {
    const apps = useInstructorApplications();
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [reason, setReason] = useState('');

    const pending = apps.filter((a) => a.status === 'PENDING');
    const decided = apps.filter((a) => a.status !== 'PENDING');

    function approve(id: string) {
        approveInstructorApplication(id);
    }
    function openReject(id: string) {
        setRejectingId(id);
    }
    function submitReject() {
        if (rejectingId) {
            rejectInstructorApplication(rejectingId, reason.trim() || undefined);
            setRejectingId(null);
            setReason('');
        }
    }

    return (
        <Stack maw={900} mx="auto" p="md">
            <Text fw={700} fz={28}>
                강사 신청 관리
            </Text>
            <Card withBorder>
                <Stack>
                    <Text fw={600}>대기중 ({pending.length})</Text>
                    <Table striped withColumnBorders withTableBorder horizontalSpacing="md" verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>사용자</Table.Th>
                                <Table.Th>표시 이름</Table.Th>
                                <Table.Th>링크</Table.Th>
                                <Table.Th>신청일</Table.Th>
                                <Table.Th>액션</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {pending.map((a) => (
                                <Table.Tr key={a.id}>
                                    <Table.Td>{a.user_id}</Table.Td>
                                    <Table.Td>{a.display_name}</Table.Td>
                                    <Table.Td>{a.links?.map((l) => l.label).join(', ')}</Table.Td>
                                    <Table.Td>{a.created_at.slice(0, 10)}</Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <Button color="green" size="xs" variant="light" onClick={() => approve(a.id)}>
                                                승인
                                            </Button>
                                            <Button color="red" size="xs" variant="light" onClick={() => openReject(a.id)}>
                                                반려
                                            </Button>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                            {pending.length === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={5}>
                                        <Text c="dimmed" size="sm">
                                            대기중 신청이 없습니다.
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Stack>
            </Card>
            <Card withBorder>
                <Stack>
                    <Text fw={600}>처리 완료 ({decided.length})</Text>
                    <Table withColumnBorders withTableBorder horizontalSpacing="md" verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>표시 이름</Table.Th>
                                <Table.Th>상태</Table.Th>
                                <Table.Th>결정일</Table.Th>
                                <Table.Th>비고</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {decided.map((a) => (
                                <Table.Tr key={a.id}>
                                    <Table.Td>{a.display_name}</Table.Td>
                                    <Table.Td>
                                        <Badge color={statusColor[a.status]}>{a.status}</Badge>
                                    </Table.Td>
                                    <Table.Td>{a.decided_at?.slice(0, 10)}</Table.Td>
                                    <Table.Td>{a.rejection_reason}</Table.Td>
                                </Table.Tr>
                            ))}
                            {decided.length === 0 && (
                                <Table.Tr>
                                    <Table.Td colSpan={4}>
                                        <Text c="dimmed" size="sm">
                                            완료된 신청이 없습니다.
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </Stack>
            </Card>

            <Modal centered opened={!!rejectingId} title="반려 사유" onClose={() => setRejectingId(null)}>
                <Stack>
                    <Textarea minRows={3} placeholder="사유 (선택)" value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setRejectingId(null)}>
                            취소
                        </Button>
                        <Button color="red" onClick={submitReject}>
                            반려 확정
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}

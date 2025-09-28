import { Badge, Button, Group, Stack, Text, Anchor, Divider, ScrollArea, Textarea, ThemeIcon, Box, Tooltip, Card } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { approveInstructorApplication, rejectInstructorApplication, revokeInstructorApplication, useInstructorApplication } from '@main/lib/repository';
import { CheckCircle2, XCircle, Link as LinkIcon, User, CalendarClock, FileText, X, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

interface InstructorAppDetailProps {
    appId: string | null;
    onClose: () => void;
}

const statusColor: Record<string, string> = {
    PENDING: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
    REVOKED: 'gray'
};

export function InstructorAppDetail({ appId, onClose }: InstructorAppDetailProps) {
    const app = useInstructorApplication(appId);
    const [rejectMode, setRejectMode] = useState(false);
    const [reason, setReason] = useState(''); // 공유 textarea 값 (반려/회수 모두 사용)

    if (!app) {
        return (
            <Stack p="md">
                <Text c="dimmed" size="sm">
                    데이터를 불러올 수 없습니다.
                </Text>
                <Button mt="sm" size="xs" variant="default" onClick={onClose}>
                    닫기
                </Button>
            </Stack>
        );
    }

    function approve() {
        if (!app) return;
        approveInstructorApplication(app.id);
        notifications.show({ color: 'teal', title: '승인 완료', message: `${app.display_name} 신청이 승인되었습니다.` });
        onClose();
    }

    function reject() {
        if (!app) return;
        // 반려 사유는 선택적: 빈 문자열이면 undefined 저장
        rejectInstructorApplication(app.id, reason.trim() || undefined);
        notifications.show({ color: 'red', title: '반려 처리', message: `${app.display_name} 신청이 반려되었습니다.` });
        onClose();
    }

    function revoke() {
        if (!app) return;
        revokeInstructorApplication(app.id, reason.trim() || undefined);
        notifications.show({ color: 'gray', title: '권한 회수', message: `${app.display_name} 강사 권한이 회수되었습니다.` });
        onClose();
    }

    const dt = (iso?: string | null) => (iso ? iso.slice(0, 16).replace('T', ' ') : '-');

    return (
        <Stack gap="xs" p="xs" style={{ minHeight: 440 }}>
            <Group align="flex-start" justify="space-between">
                <Group gap={6}>
                    <ThemeIcon color={statusColor[app.status]} radius="md" size={26}>
                        <User size={16} />
                    </ThemeIcon>
                    <Text fw={700} size="lg">
                        {app.display_name}
                    </Text>
                </Group>
                <Group gap={12}>
                    <Badge color={statusColor[app.status]} variant="light">
                        {app.status}
                    </Badge>
                    <Badge color="gray" variant="outline">
                        {app.user_id}
                    </Badge>
                </Group>
            </Group>
            <Divider my={4} />
            <ScrollArea offsetScrollbars h={300} type="auto">
                <Stack gap="md">
                    <Box>
                        <Group gap={6} mb={4}>
                            <ThemeIcon color="blue" size={22} variant="light">
                                <FileText size={14} />
                            </ThemeIcon>

                            <Text c="dimmed" fw={600} size="xs" tt="uppercase">
                                소개
                            </Text>
                        </Group>
                        <Card withBorder w="100%">
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                                {app.bio_md || '소개가 없습니다.'}
                            </Text>
                        </Card>
                    </Box>
                    <Box>
                        <Group gap={6} mb={4}>
                            <ThemeIcon color="indigo" size={22} variant="light">
                                <LinkIcon size={14} />
                            </ThemeIcon>
                            <Text c="dimmed" fw={600} size="xs" tt="uppercase">
                                링크
                            </Text>
                        </Group>
                        {app.links && app.links.length > 0 ? (
                            <Stack gap={4}>
                                {app.links.map((l) => (
                                    <Anchor key={l.url} c="blue" href={l.url} rel="noopener" size="sm" target="_blank">
                                        {l.label}
                                    </Anchor>
                                ))}
                            </Stack>
                        ) : (
                            <Text c="dimmed" size="xs">
                                등록된 링크 없음
                            </Text>
                        )}
                    </Box>
                    <Group gap="xl" wrap="nowrap">
                        <Stack flex={1} gap={2} style={{ minWidth: 140 }}>
                            <Group gap={4}>
                                <CalendarClock size={14} />
                                <Text c="dimmed" fw={600} size="xs">
                                    신청일
                                </Text>
                            </Group>
                            <Text size="sm">{dt(app.created_at)}</Text>
                        </Stack>
                        <Stack flex={1} gap={2} style={{ minWidth: 140 }}>
                            <Group gap={4}>
                                <CalendarClock size={14} />
                                <Text c="dimmed" fw={600} size="xs">
                                    결정일
                                </Text>
                            </Group>
                            <Text size="sm">{dt(app.decided_at)}</Text>
                        </Stack>
                    </Group>
                    {app.rejection_reason && (
                        <Box>
                            <Group gap={6} mb={4}>
                                <ThemeIcon color="red" size={22} variant="light">
                                    <XCircle size={14} />
                                </ThemeIcon>
                                <Text c="dimmed" fw={600} size="xs" tt="uppercase">
                                    반려 사유
                                </Text>
                            </Group>
                            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                {app.rejection_reason}
                            </Text>
                        </Box>
                    )}
                    {app.status === 'REVOKED' && (
                        <Box>
                            <Group gap={6} mb={4}>
                                <ThemeIcon color="gray" size={22} variant="light">
                                    <ShieldAlert size={14} />
                                </ThemeIcon>
                                <Text c="dimmed" fw={600} size="xs" tt="uppercase">
                                    회수 정보
                                </Text>
                            </Group>
                            <Text c="dimmed" size="sm">
                                회수일: {dt(app.revoked_at)}
                            </Text>
                            {app.revoke_reason && (
                                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                    사유: {app.revoke_reason}
                                </Text>
                            )}
                        </Box>
                    )}
                </Stack>
            </ScrollArea>
            {/* Unified Action Footer */}
            <Stack gap={8} pt="lg" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                {/* Contextual textarea (reject or revoke) */}
                {app.status === 'PENDING' && rejectMode && (
                    <Textarea
                        autosize
                        label="반려 사유 (선택)"
                        maxRows={5}
                        minRows={2}
                        placeholder="사유를 입력하거나 비워둘 수 있습니다"
                        size="xs"
                        value={reason}
                        onChange={(e) => setReason(e.currentTarget.value)}
                    />
                )}
                {app.status === 'APPROVED' && (
                    <Textarea
                        autosize
                        label="권한 회수 사유 (선택)"
                        maxRows={4}
                        minRows={2}
                        placeholder="정책 위반/법적 문제 등 (비워두면 사유 미표시)"
                        size="xs"
                        value={reason}
                        onChange={(e) => setReason(e.currentTarget.value)}
                    />
                )}
                <Group gap={6} justify="flex-end">
                    {app.status === 'PENDING' && !rejectMode && (
                        <>
                            <Tooltip withArrow label="신청 승인">
                                <Button color="teal" leftSection={<CheckCircle2 size={14} />} size="xs" onClick={approve}>
                                    승인
                                </Button>
                            </Tooltip>
                            <Tooltip withArrow label="신청 반려">
                                <Button color="red" leftSection={<XCircle size={14} />} size="xs" onClick={() => setRejectMode(true)}>
                                    반려
                                </Button>
                            </Tooltip>
                        </>
                    )}
                    {app.status === 'PENDING' && rejectMode && (
                        <>
                            <Button color="red" leftSection={<XCircle size={14} />} size="xs" onClick={reject}>
                                반려 확정
                            </Button>
                            <Button leftSection={<X size={14} />} size="xs" variant="default" onClick={() => setRejectMode(false)}>
                                취소
                            </Button>
                        </>
                    )}
                    {app.status === 'APPROVED' && (
                        <Button color="gray" leftSection={<ShieldAlert size={14} />} size="xs" onClick={revoke}>
                            권한 회수
                        </Button>
                    )}
                    <Button leftSection={<X size={14} />} size="xs" variant="default" onClick={onClose}>
                        닫기
                    </Button>
                </Group>
            </Stack>
        </Stack>
    );
}

export default InstructorAppDetail;

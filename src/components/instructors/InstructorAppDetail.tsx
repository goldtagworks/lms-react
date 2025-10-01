import { Badge, Button, Group, Stack, Anchor, Divider, ScrollArea, Textarea, ThemeIcon, Box, Tooltip, Card } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import { notifications } from '@mantine/notifications';
import { approveInstructorApplication, rejectInstructorApplication, revokeInstructorApplication, useInstructorApplication } from '@main/lib/repository';
import { CheckCircle2, XCircle, Link as LinkIcon, User, CalendarClock, FileText, X, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@main/lib/i18n';

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
    const { t } = useI18n();

    if (!app) {
        return (
            <Stack p="md">
                <TextMeta>{t('errors.dataUnavailable', undefined, '데이터를 불러올 수 없습니다.')}</TextMeta>
                <Button mt="sm" size="sm" variant="default" onClick={onClose}>
                    {t('common.close')}
                </Button>
            </Stack>
        );
    }

    function approve() {
        if (!app) return;
        approveInstructorApplication(app.id);
        notifications.show({ color: 'teal', title: t('notify.success.approve'), message: t('instructor.appApproved', { name: app.display_name }, '{{name}} 신청이 승인되었습니다.') });
        onClose();
    }

    function reject() {
        if (!app) return;
        // 반려 사유는 선택적: 빈 문자열이면 undefined 저장
        rejectInstructorApplication(app.id, reason.trim() || undefined);
        notifications.show({ color: 'red', title: t('notify.success.reject'), message: t('instructor.appRejected', { name: app.display_name }, '{{name}} 신청이 반려되었습니다.') });
        onClose();
    }

    function revoke() {
        if (!app) return;
        revokeInstructorApplication(app.id, reason.trim() || undefined);
        notifications.show({ color: 'gray', title: t('notify.success.revoke'), message: t('instructor.appRevoked', { name: app.display_name }, '{{name}} 강사 권한이 회수되었습니다.') });
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
                    <TextBody fw={700} sizeOverride="lg">
                        {app.display_name}
                    </TextBody>
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

                            <TextMeta fw={600} sizeOverride="sm" tt="uppercase">
                                {t('instructor.bio', undefined, '소개')}
                            </TextMeta>
                        </Group>
                        <Card withBorder radius="md" w="100%">
                            <TextBody style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{app.bio_md || t('instructor.noBio', undefined, '소개가 없습니다.')}</TextBody>
                        </Card>
                    </Box>
                    <Box>
                        <Group gap={6} mb={4}>
                            <ThemeIcon color="indigo" size={22} variant="light">
                                <LinkIcon size={14} />
                            </ThemeIcon>
                            <TextMeta fw={600} sizeOverride="sm" tt="uppercase">
                                {t('instructor.links', undefined, '링크')}
                            </TextMeta>
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
                            <TextMeta>{t('instructor.noLinks', undefined, '등록된 링크 없음')}</TextMeta>
                        )}
                    </Box>
                    <Group gap="xl" wrap="nowrap">
                        <Stack flex={1} gap={2} style={{ minWidth: 140 }}>
                            <Group gap={4}>
                                <CalendarClock size={14} />
                                <TextMeta fw={600} sizeOverride="sm">
                                    {t('instructor.appliedAt', undefined, '신청일')}
                                </TextMeta>
                            </Group>
                            <TextMeta>{dt(app.created_at)}</TextMeta>
                        </Stack>
                        <Stack flex={1} gap={2} style={{ minWidth: 140 }}>
                            <Group gap={4}>
                                <CalendarClock size={14} />
                                <TextMeta fw={600} sizeOverride="sm">
                                    {t('instructor.decidedAt', undefined, '결정일')}
                                </TextMeta>
                            </Group>
                            <TextMeta>{dt(app.decided_at)}</TextMeta>
                        </Stack>
                    </Group>
                    {app.rejection_reason && (
                        <Box>
                            <Group gap={6} mb={4}>
                                <ThemeIcon color="red" size={22} variant="light">
                                    <XCircle size={14} />
                                </ThemeIcon>
                                <TextMeta fw={600} sizeOverride="sm" tt="uppercase">
                                    {t('instructor.rejectReason', undefined, '반려 사유')}
                                </TextMeta>
                            </Group>
                            <TextBody style={{ whiteSpace: 'pre-wrap' }}>{app.rejection_reason}</TextBody>
                        </Box>
                    )}
                    {app.status === 'REVOKED' && (
                        <Box>
                            <Group gap={6} mb={4}>
                                <ThemeIcon color="gray" size={22} variant="light">
                                    <ShieldAlert size={14} />
                                </ThemeIcon>
                                <TextMeta fw={600} sizeOverride="sm" tt="uppercase">
                                    {t('instructor.revokeInfo', undefined, '회수 정보')}
                                </TextMeta>
                            </Group>
                            <TextMeta>
                                {t('instructor.revokedAt', undefined, '회수일')}: {dt(app.revoked_at)}
                            </TextMeta>
                            {app.revoke_reason && (
                                <TextBody style={{ whiteSpace: 'pre-wrap' }}>
                                    {t('instructor.reason', undefined, '사유')}: {app.revoke_reason}
                                </TextBody>
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
                        label={t('instructor.rejectReasonOptional', undefined, '반려 사유 (선택)')}
                        maxRows={5}
                        minRows={2}
                        placeholder={t('instructor.reasonPlaceholder', undefined, '사유를 입력하거나 비워둘 수 있습니다')}
                        size="sm"
                        value={reason}
                        onChange={(e) => setReason(e.currentTarget.value)}
                    />
                )}
                {app.status === 'APPROVED' && (
                    <Textarea
                        autosize
                        label={t('instructor.revokeReasonOptional', undefined, '권한 회수 사유 (선택)')}
                        maxRows={4}
                        minRows={2}
                        placeholder={t('instructor.revokeReasonPlaceholder', undefined, '정책 위반/법적 문제 등 (비워두면 사유 미표시)')}
                        size="sm"
                        value={reason}
                        onChange={(e) => setReason(e.currentTarget.value)}
                    />
                )}
                <Group gap={6} justify="flex-end">
                    {app.status === 'PENDING' && !rejectMode && (
                        <>
                            <Tooltip withArrow label={t('instructor.approveTooltip', undefined, '신청 승인')}>
                                <Button color="teal" leftSection={<CheckCircle2 size={14} />} size="sm" onClick={approve}>
                                    {t('common.approve')}
                                </Button>
                            </Tooltip>
                            <Tooltip withArrow label={t('instructor.rejectTooltip', undefined, '신청 반려')}>
                                <Button color="red" leftSection={<XCircle size={14} />} size="sm" onClick={() => setRejectMode(true)}>
                                    {t('common.reject')}
                                </Button>
                            </Tooltip>
                        </>
                    )}
                    {app.status === 'PENDING' && rejectMode && (
                        <>
                            <Button color="red" leftSection={<XCircle size={14} />} size="sm" onClick={reject}>
                                {t('instructor.rejectConfirm', undefined, '반려 확정')}
                            </Button>
                            <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setRejectMode(false)}>
                                {t('common.cancel')}
                            </Button>
                        </>
                    )}
                    {app.status === 'APPROVED' && (
                        <Button color="gray" leftSection={<ShieldAlert size={14} />} size="sm" onClick={revoke}>
                            {t('common.revoke')}
                        </Button>
                    )}
                    <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={onClose}>
                        {t('common.close')}
                    </Button>
                </Group>
            </Stack>
        </Stack>
    );
}

export default InstructorAppDetail;

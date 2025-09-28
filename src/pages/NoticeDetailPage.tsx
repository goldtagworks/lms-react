import { useParams, Link, useNavigate } from 'react-router-dom';
import { togglePin, deleteNotice, useNotice } from '@main/lib/noticeRepo';
import PageContainer from '@main/components/layout/PageContainer';
import EmptyState from '@main/components/EmptyState';
import { Badge, Group, Stack, Text, Anchor, Paper, Divider, ActionIcon, Tooltip, Title } from '@mantine/core';
import MarkdownView from '@main/components/markdown/MarkdownView';
import { formatDate } from '@main/utils/format';
import { ChevronLeft, Pin, Share2, Copy, Pencil, Trash2 } from 'lucide-react';
import NoticeEditor from '@main/components/notices/NoticeEditor';
import useCopyLink from '@main/hooks/useCopyLink';
import { useAuth } from '@main/lib/auth';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';

export default function NoticeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const notice = useNotice(id);
    const { copied, copy } = useCopyLink();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    if (!notice) {
        return (
            <PageContainer roleMain>
                <EmptyState message="해당 공지사항을 찾을 수 없습니다." />
            </PageContainer>
        );
    }

    function handleCopyLink() {
        copy();
    }

    function handleTogglePin() {
        if (!isAdmin || !notice) return;
        togglePin(notice.id);
        notifications.show({ message: notice.pinned ? '공지 상단 고정 해제됨' : '공지 상단에 고정됨', color: 'teal' });
    }

    function handleEdit() {
        if (!isAdmin || !notice) return;
        modals.open({
            modalId: 'notice-editor-modal',
            title: '공지 수정',
            centered: true,
            size: '800px',
            children: (
                <NoticeEditor
                    initialBody={notice.body}
                    initialPinned={!!notice.pinned}
                    initialTitle={notice.title}
                    noticeId={notice.id}
                    onCancel={() => modals.close('notice-editor-modal')}
                    onSaved={() => {
                        modals.close('notice-editor-modal');
                    }}
                />
            )
        });
    }

    function handleDelete() {
        if (!isAdmin || !notice) return;
        modals.openConfirmModal({
            title: '공지 삭제',
            centered: true,
            children: <Text size="sm">정말로 이 공지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</Text>,
            labels: { confirm: '삭제', cancel: '취소' },
            confirmProps: { color: 'red' },
            onConfirm: () => {
                const ok = deleteNotice(notice.id);

                if (ok) {
                    notifications.show({ message: '공지 삭제 완료', color: 'teal' });
                    navigate('/notices');
                } else {
                    notifications.show({ message: '삭제 실패: 이미 삭제되었거나 찾을 수 없습니다.', color: 'red' });
                }
            }
        });
    }

    return (
        <PageContainer roleMain>
            <Stack gap="lg" mt="md">
                {/* 상단 내비게이션 및 액션 */}
                <Group justify="space-between" wrap="nowrap">
                    <Anchor
                        aria-label="공지사항 목록으로"
                        component={Link}
                        style={{ alignItems: 'center', color: 'var(--mantine-color-dimmed)', display: 'inline-flex', gap: 6 }}
                        to="/notices"
                        underline="never"
                    >
                        <ActionIcon aria-hidden="true" size="sm" variant="subtle">
                            <ChevronLeft size={16} />
                        </ActionIcon>
                        <Text c="dimmed" size="sm">
                            공지사항
                        </Text>
                    </Anchor>
                    <Group gap={4} wrap="nowrap">
                        {isAdmin && (
                            <Tooltip withArrow label={notice.pinned ? '상단 고정 해제' : '상단 고정'}>
                                <ActionIcon
                                    aria-label={notice.pinned ? '고정 해제' : '상단 고정'}
                                    color={notice.pinned ? 'red' : 'dimmed'}
                                    variant={notice.pinned ? 'light' : 'subtle'}
                                    onClick={handleTogglePin}
                                >
                                    <Pin size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {isAdmin && (
                            <Tooltip withArrow label="공지 수정">
                                <ActionIcon aria-label="공지 수정" variant="subtle" onClick={handleEdit}>
                                    <Pencil size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {isAdmin && (
                            <Tooltip withArrow label="공지 삭제">
                                <ActionIcon aria-label="공지 삭제" color="red" variant="subtle" onClick={handleDelete}>
                                    <Trash2 size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        <Tooltip withArrow label="링크 복사">
                            <ActionIcon aria-label="링크 복사" color={copied ? 'teal' : 'yellow'} variant="subtle" onClick={handleCopyLink}>
                                {copied ? <Copy size={16} /> : <Share2 size={16} />}
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                <Paper withBorder aria-labelledby="notice-title" component="article" p="xl" radius="md" shadow="sm">
                    <Stack gap="sm">
                        <Title fw={700} id="notice-title" order={2} style={{ lineHeight: 1.3 }}>
                            {notice.title}
                        </Title>
                        <Group gap="xs" wrap="wrap">
                            {notice.pinned && (
                                <Badge color="red" size="sm" variant="light">
                                    PIN
                                </Badge>
                            )}
                            <Text c="dimmed" size="xs">
                                게시일 {formatDate(notice.created_at)}
                            </Text>
                        </Group>
                        <Divider my="xs" />
                        <MarkdownView source={notice.body} />
                    </Stack>
                </Paper>

                {/* 하단 재동작 링크 */}
                <Group justify="flex-end">
                    <Anchor component={Link} size="sm" to="/notices" underline="always">
                        목록으로 돌아가기
                    </Anchor>
                </Group>
            </Stack>
        </PageContainer>
    );
}

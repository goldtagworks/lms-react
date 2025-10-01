import { Card, Group, Badge, Stack, Button, Tooltip, ActionIcon, Modal } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import { useNavigate } from 'react-router-dom';
// In-memory noticeRepo 제거: Supabase 기반 훅 사용
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import EmptyState from '@main/components/EmptyState';
import { useI18n } from '@main/lib/i18n';
import { formatDate } from '@main/utils/format';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useState, useMemo } from 'react';
import PaginationBar from '@main/components/PaginationBar';
import useNoticesPaged from '@main/hooks/useNoticesPaged';
import { useNoticeMutations } from '@main/hooks/useNoticeMutations';
import { useAuth } from '@main/lib/auth';
import NoticeEditor from '@main/components/notices/NoticeEditor';
import { Pin, Pencil, Trash2 } from 'lucide-react';

export default function NoticesPage() {
    const { t } = useI18n();
    const { remove, togglePin } = useNoticeMutations();
    const [page, setPage] = useState(1);
    const { data } = useNoticesPaged(page, { pageSize: 15, includePinnedFirst: true });
    const totalPages = data?.pageCount || 1;
    const paged = data?.items || [];
    const navigate = useNavigate();

    const { user } = useAuth(); // 사용자 컨텍스트 (admin 여부 판단)
    const isAdmin = user?.role === 'admin';
    const [editorState, setEditorState] = useState<{ id?: string } | null>(null);

    function openCreate() {
        if (!isAdmin) return;
        setEditorState({});
    }

    function openEdit(id: string) {
        if (!isAdmin) return;
        setEditorState({ id });
    }

    function closeEditor() {
        setEditorState(null);
    }

    function handleTogglePin(id: string) {
        if (!isAdmin) return;
        togglePin.mutate(id, {
            onSuccess: () => notifications.show({ color: 'blue', title: t('notify.success.generic'), message: t('notice.pinToggled') }),
            onError: () => notifications.show({ color: 'red', title: t('notify.error.generic'), message: t('notice.pinToggleFail') })
        });
    }

    function handleDelete(id: string, title?: string) {
        if (!isAdmin) return;

        modals.openConfirmModal({
            radius: 'md',
            title: t('notice.deleteTitle', {}, '공지 삭제'),
            centered: true,
            children: <TextBody>{t('notice.deleteConfirm', { title: title || '' }, '정말로 삭제하시겠습니까?')}</TextBody>,
            labels: { cancel: t('common.cancel', {}, '취소'), confirm: t('common.delete', {}, '삭제') },
            confirmProps: { color: 'red' },
            onConfirm: () => {
                try {
                    remove.mutate(id, {
                        onSuccess: () => notifications.show({ color: 'teal', title: t('notify.success.generic'), message: t('notice.deleteDone') }),
                        onError: () => notifications.show({ color: 'red', title: t('notify.error.generic'), message: t('notice.deleteFail') })
                    });
                } catch {
                    notifications.show({ color: 'red', title: t('notify.error.generic'), message: t('notice.deleteFail') });
                }
            }
        });
    }
    const editingNotice = useMemo(() => (editorState?.id ? paged.find((n) => n.id === editorState.id) : undefined), [editorState, paged]);

    return (
        <PageContainer roleMain>
            <Group justify="space-between" mb="md">
                <PageHeader description={t('empty.noticesIntro')} title={t('notice.list')} />
                {isAdmin && (
                    <Button size="sm" variant="light" onClick={openCreate}>
                        {t('empty.noticeCreate')}
                    </Button>
                )}
            </Group>
            {paged.length === 0 && <EmptyState message={t('empty.notices')} />}
            <Stack gap="md">
                {paged.map((n) => (
                    <Card key={n.id} withBorder aria-label={n.title} component="article" radius="lg" shadow="sm" style={{ cursor: 'pointer' }}>
                        <Group align="flex-start" justify="space-between">
                            <Stack gap={4} style={{ flex: 1 }} onClick={() => navigate(`/notices/${n.id}`)}>
                                <Group gap="xs">
                                    {n.pinned && (
                                        <Badge color="red" title={t('notice.pinned')} variant="light">
                                            {t('notice.badgePinned')}
                                        </Badge>
                                    )}
                                    <TextBody fw={600} sizeOverride="sm">
                                        {n.title}
                                    </TextBody>
                                </Group>
                                <TextMeta>{formatDate(n.created_at)}</TextMeta>
                                {n.body && (
                                    <TextMeta aria-label={t('notice.bodyLabel')} lineClamp={3}>
                                        {n.body}
                                    </TextMeta>
                                )}
                            </Stack>
                            {isAdmin && (
                                <Group gap={6} wrap="nowrap">
                                    <Tooltip withArrow label={n.pinned ? t('notice.unpin') : t('notice.pin')}>
                                        <ActionIcon
                                            aria-label={n.pinned ? t('notice.unpin') : t('notice.pin')}
                                            color={n.pinned ? 'red' : 'dimmed'}
                                            variant={n.pinned ? 'light' : 'subtle'}
                                            onClick={() => handleTogglePin(n.id)}
                                        >
                                            <Pin size={16} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <Tooltip withArrow label={t('notice.edit')}>
                                        <ActionIcon aria-label={t('notice.edit')} variant="subtle" onClick={() => openEdit(n.id)}>
                                            <Pencil size={16} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <Tooltip withArrow label={t('notice.delete')}>
                                        <ActionIcon aria-label={t('notice.delete')} color="red" variant="subtle" onClick={() => handleDelete(n.id, n.title)}>
                                            <Trash2 size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            )}
                        </Group>
                    </Card>
                ))}
            </Stack>
            <PaginationBar align="right" page={page} totalPages={totalPages} onChange={setPage} />
            <Modal centered withinPortal opened={!!editorState} radius="md" size="800px" title={editingNotice ? t('notice.update') : t('empty.noticeCreate')} onClose={closeEditor}>
                {editorState && (
                    <NoticeEditor
                        initialBody={editingNotice?.body || ''}
                        initialPinned={!!editingNotice?.pinned}
                        initialTitle={editingNotice?.title}
                        noticeId={editingNotice?.id}
                        onCancel={closeEditor}
                        onSaved={() => {
                            closeEditor();
                        }}
                    />
                )}
            </Modal>
        </PageContainer>
    );
}

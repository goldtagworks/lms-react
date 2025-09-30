import { useParams, Link, useNavigate } from 'react-router-dom';
import { togglePin, deleteNotice, useNotice } from '@main/lib/noticeRepo';
import PageContainer from '@main/components/layout/PageContainer';
import EmptyState from '@main/components/EmptyState';
import { Badge, Group, Stack, Anchor, Paper, Divider, ActionIcon, Tooltip, Title } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import MarkdownView from '@main/components/markdown/MarkdownView';
import { formatDate } from '@main/utils/format';
import { ChevronLeft, Pin, Share2, Copy, Pencil, Trash2 } from 'lucide-react';
import NoticeEditor from '@main/components/notices/NoticeEditor';
import useCopyLink from '@main/hooks/useCopyLink';
import { useAuth } from '@main/lib/auth';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useI18n } from '@main/lib/i18n';

export default function NoticeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const notice = useNotice(id);
    const { copied, copy } = useCopyLink();
    const { t } = useI18n();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    if (!notice) {
        return (
            <PageContainer roleMain>
                <EmptyState message={t('empty.noticeMissing')} />
            </PageContainer>
        );
    }

    function handleCopyLink() {
        copy();
    }

    function handleTogglePin() {
        if (!isAdmin || !notice) return;
        togglePin(notice.id);
        notifications.show({ message: notice.pinned ? t('notice.unpinned') : t('notice.pinned'), color: 'teal' });
    }

    function handleEdit() {
        if (!isAdmin || !notice) return;
        modals.open({
            modalId: 'notice-editor-modal',
            title: t('notice.edit'),
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
            radius: 'md',
            title: t('notice.deleteTitle'),
            centered: true,
            children: <TextBody>{t('notice.deleteConfirm')}</TextBody>,
            labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
            confirmProps: { color: 'red' },
            onConfirm: () => {
                const ok = deleteNotice(notice.id);

                if (ok) {
                    notifications.show({ message: t('notice.deleteDone'), color: 'teal' });
                    navigate('/notices');
                } else {
                    notifications.show({ message: t('notice.deleteFail'), color: 'red' });
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
                        aria-label={t('notice.backToList')}
                        component={Link}
                        style={{ alignItems: 'center', color: 'var(--mantine-color-dimmed)', display: 'inline-flex', gap: 6 }}
                        to="/notices"
                        underline="never"
                    >
                        <ActionIcon aria-hidden="true" size="sm" variant="subtle">
                            <ChevronLeft size={16} />
                        </ActionIcon>
                        <TextMeta sizeOverride="sm">{t('notice.list')}</TextMeta>
                    </Anchor>
                    <Group gap={4} wrap="nowrap">
                        {isAdmin && (
                            <Tooltip withArrow label={notice.pinned ? t('notice.unpin') : t('notice.pin')}>
                                <ActionIcon
                                    aria-label={notice.pinned ? t('notice.unpin') : t('notice.pin')}
                                    color={notice.pinned ? 'red' : 'dimmed'}
                                    variant={notice.pinned ? 'light' : 'subtle'}
                                    onClick={handleTogglePin}
                                >
                                    <Pin size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {isAdmin && (
                            <Tooltip withArrow label={t('notice.edit')}>
                                <ActionIcon aria-label={t('notice.edit')} variant="subtle" onClick={handleEdit}>
                                    <Pencil size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        {isAdmin && (
                            <Tooltip withArrow label={t('common.delete')}>
                                <ActionIcon aria-label={t('common.delete')} color="red" variant="subtle" onClick={handleDelete}>
                                    <Trash2 size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        <Tooltip withArrow label={copied ? t('common.copied') : t('common.copyLink')}>
                            <ActionIcon aria-label={t('common.copyLink')} color={copied ? 'teal' : 'yellow'} variant="subtle" onClick={handleCopyLink}>
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
                                    {t('notice.badgePinned')}
                                </Badge>
                            )}
                            <TextMeta>{t('notice.postedAt', { date: formatDate(notice.created_at) })}</TextMeta>
                        </Group>
                        <Divider my="xs" />
                        <MarkdownView source={notice.body} />
                    </Stack>
                </Paper>

                {/* 하단 재동작 링크 */}
                <Group justify="flex-end">
                    <Anchor component={Link} size="sm" to="/notices" underline="always">
                        {t('notice.backLink')}
                    </Anchor>
                </Group>
            </Stack>
        </PageContainer>
    );
}

import { Card, Group, Badge, Text, Stack, Button, Tooltip, ActionIcon, Modal } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useNotices, togglePin, deleteNotice } from '@main/lib/noticeRepo';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import EmptyState from '@main/components/EmptyState';
import { formatDate } from '@main/utils/format';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useState, useEffect, useMemo } from 'react';
import PaginationBar from '@main/components/PaginationBar';
import { useAuth } from '@main/lib/auth';
import NoticeEditor from '@main/components/notices/NoticeEditor';
import { Pin, Pencil, Trash2 } from 'lucide-react';

export default function NoticesPage() {
    // reactive notices (pin 토글/수정 즉시 반영)
    const notices = useNotices();
    const PAGE_SIZE = 15;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(notices.length / PAGE_SIZE));
    const paged = notices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages, notices.length]);
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
        try {
            togglePin(id);
            notifications.show({ color: 'blue', title: '업데이트', message: '핀 상태 변경' });
        } catch {
            notifications.show({ color: 'red', title: '오류', message: '핀 상태 변경 실패' });
        }
    }

    function handleDelete(id: string) {
        if (!isAdmin) return;
        const n = notices.find((x) => x.id === id);

        modals.openConfirmModal({
            title: '공지 삭제',
            centered: true,
            children: <Text size="sm">정말로 삭제하시겠습니까? ({n?.title})</Text>,
            labels: { cancel: '취소', confirm: '삭제' },
            confirmProps: { color: 'red' },
            onConfirm: () => {
                try {
                    deleteNotice(id);
                    notifications.show({ color: 'teal', title: '완료', message: '삭제되었습니다' });
                } catch {
                    notifications.show({ color: 'red', title: '오류', message: '삭제 실패' });
                }
            }
        });
    }
    const editingNotice = useMemo(() => (editorState?.id ? notices.find((n) => n.id === editorState.id) : undefined), [editorState, notices]);

    return (
        <PageContainer roleMain>
            <Group justify="space-between" mb="md">
                <PageHeader description="서비스 업데이트 및 점검 안내" title="공지사항" />
                {isAdmin && (
                    <Button size="xs" variant="light" onClick={openCreate}>
                        새 공지 작성
                    </Button>
                )}
            </Group>
            {notices.length === 0 && <EmptyState message="등록된 공지사항이 없습니다." />}
            <Stack gap="md">
                {paged.map((n) => (
                    <Card key={n.id} withBorder aria-label={n.title} component="article" radius="md" shadow="xs" style={{ cursor: 'pointer' }}>
                        <Group align="flex-start" justify="space-between">
                            <Stack gap={4} style={{ flex: 1 }} onClick={() => navigate(`/notices/${n.id}`)}>
                                <Group gap="xs">
                                    {n.pinned && (
                                        <Badge color="red" title="상단 고정" variant="light">
                                            PIN
                                        </Badge>
                                    )}
                                    <Text fw={600}>{n.title}</Text>
                                </Group>
                                <Text c="dimmed" size="xs">
                                    {formatDate(n.created_at)}
                                </Text>
                                {n.body && (
                                    <Text aria-label="본문 요약" c="dimmed" lineClamp={3} size="sm">
                                        {n.body}
                                    </Text>
                                )}
                            </Stack>
                            {isAdmin && (
                                <Group gap={6} wrap="nowrap">
                                    <Tooltip withArrow label={n.pinned ? '상단 고정 해제' : '상단 고정'}>
                                        <ActionIcon
                                            aria-label={n.pinned ? '고정 해제' : '상단 고정'}
                                            color={n.pinned ? 'red' : 'dimmed'}
                                            variant={n.pinned ? 'light' : 'subtle'}
                                            onClick={() => handleTogglePin(n.id)}
                                        >
                                            <Pin size={16} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <Tooltip withArrow label="공지 수정">
                                        <ActionIcon aria-label="공지 수정" variant="subtle" onClick={() => openEdit(n.id)}>
                                            <Pencil size={16} />
                                        </ActionIcon>
                                    </Tooltip>

                                    <Tooltip withArrow label="공지 삭제">
                                        <ActionIcon aria-label="공지 삭제" color="red" variant="subtle" onClick={() => handleDelete(n.id)}>
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
            <Modal centered withinPortal opened={!!editorState} size="800px" title={editingNotice ? '공지 수정' : '새 공지 작성'} onClose={closeEditor}>
                {editorState && (
                    <NoticeEditor
                        initialBody={editingNotice?.body}
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

import { Card, Group, Badge, Text, Stack, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { listNotices, togglePin, deleteNotice } from '@main/lib/noticeRepo';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import EmptyState from '@main/components/EmptyState';
import { formatDate } from '@main/utils/format';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useAuth } from '@main/lib/auth';
import NoticeEditor from '@main/components/notices/NoticeEditor';

export default function NoticesPage() {
    const notices = listNotices();
    const navigate = useNavigate();

    const { user } = useAuth(); // 사용자 컨텍스트 (admin 여부 판단)
    const isAdmin = user?.role === 'admin';
    const [editorState, setEditorState] = useState<{ open: boolean; id?: string } | null>(null);

    function openCreate() {
        if (!isAdmin) return;
        setEditorState({ open: true });
    }

    function openEdit(id: string) {
        if (!isAdmin) return;
        setEditorState({ open: true, id });
    }

    function closeEditor() {
        setEditorState(null);
        modals.close('notice-editor-modal');
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
    // 모달 열기 (create / edit 공용)
    if (editorState?.open) {
        const editing = editorState.id ? notices.find((n) => n.id === editorState.id) : undefined;

        modals.open({
            modalId: 'notice-editor-modal',
            title: editing ? '공지 수정' : '새 공지 작성',
            centered: true,
            size: '800px',
            onClose: () => {
                closeEditor();
            },
            children: (
                <NoticeEditor
                    initialBody={editing?.body}
                    initialPinned={!!editing?.pinned}
                    initialTitle={editing?.title}
                    noticeId={editing?.id}
                    onCancel={closeEditor}
                    onSaved={() => {
                        closeEditor();
                    }}
                />
            )
        });
    }

    return (
        <PageContainer>
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
                {notices.map((n) => (
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
                                    <Button size="xs" variant="subtle" onClick={() => openEdit(n.id)}>
                                        수정
                                    </Button>
                                    <Button size="xs" variant="outline" onClick={() => handleTogglePin(n.id)}>
                                        {n.pinned ? '핀 해제' : '핀 고정'}
                                    </Button>
                                    <Button color="red" size="xs" variant="light" onClick={() => handleDelete(n.id)}>
                                        삭제
                                    </Button>
                                </Group>
                            )}
                        </Group>
                    </Card>
                ))}
            </Stack>
        </PageContainer>
    );
}

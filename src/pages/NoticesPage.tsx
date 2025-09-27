import { Card, Group, Badge, Text, Stack, Button, TextInput, Textarea } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { listNotices, addNotice, updateNotice, togglePin, deleteNotice } from '@main/lib/noticeRepo';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import EmptyState from '@main/components/EmptyState';
import { formatDate } from '@main/utils/format';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { useAuth } from '@main/lib/auth';

export default function NoticesPage() {
    const notices = listNotices();
    const navigate = useNavigate();

    useAuth(); // 로그인 컨텍스트 초기화만 (현재 테스트 강제 관리자 노출)
    const [refresh, setRefresh] = useState(0);
    const [draft, setDraft] = useState<{ id?: string; title: string; body: string; pinned: boolean } | null>(null);

    useEffect(() => {
        // refresh trigger only
    }, [refresh]);

    function openCreate() {
        const d = { title: '', body: '', pinned: false };

        setDraft(d);
        // state 반영 후 모달 띄우기 (동일 tick 보장 위해 microtask)
        queueMicrotask(() => openDraftModal(d));
    }

    function openEdit(id: string) {
        const n = notices.find((x) => x.id === id);

        if (!n) return;

        const d = { id, title: n.title, body: n.body, pinned: !!n.pinned };

        setDraft(d);
        queueMicrotask(() => openDraftModal(d));
    }

    function submitDraft() {
        if (!draft) return;
        if (!draft.title.trim()) {
            notifications.show({ color: 'red', title: '검증 오류', message: '제목은 필수입니다' });

            return;
        }
        try {
            if (draft.id) {
                updateNotice(draft.id, { title: draft.title.trim(), body: draft.body.trim(), pinned: draft.pinned });
                notifications.show({ color: 'teal', title: '성공', message: '공지 수정 완료' });
            } else {
                addNotice({ title: draft.title.trim(), body: draft.body.trim(), pinned: draft.pinned });
                notifications.show({ color: 'teal', title: '성공', message: '공지 생성 완료' });
            }
            setDraft(null);
            modals.close('notice-draft-modal');
            setRefresh((v) => v + 1);
        } catch {
            notifications.show({ color: 'red', title: '오류', message: '저장 실패' });
        }
    }

    function handleTogglePin(id: string) {
        try {
            togglePin(id);
            setRefresh((v) => v + 1);
            notifications.show({ color: 'blue', title: '업데이트', message: '핀 상태 변경' });
        } catch {
            notifications.show({ color: 'red', title: '오류', message: '핀 상태 변경 실패' });
        }
    }

    function handleDelete(id: string) {
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
                    setRefresh((v) => v + 1);
                    notifications.show({ color: 'teal', title: '완료', message: '삭제되었습니다' });
                } catch {
                    notifications.show({ color: 'red', title: '오류', message: '삭제 실패' });
                }
            }
        });
    }

    function openDraftModal(d: { id?: string; title: string; body: string; pinned: boolean }) {
        const isEdit = !!d.id;

        modals.open({
            modalId: 'notice-draft-modal',
            title: isEdit ? '공지 수정' : '새 공지 작성',
            centered: true,
            size: '800px',
            children: (
                <Stack gap="md" mt="sm">
                    <TextInput
                        data-autofocus
                        label="제목"
                        placeholder="공지 제목"
                        size="md"
                        value={d.title}
                        onChange={(e) => setDraft((prev) => (prev ? { ...prev, title: e.currentTarget.value } : prev))}
                    />
                    <Textarea
                        autosize
                        label="본문"
                        maxRows={30}
                        minRows={10}
                        placeholder="공지 본문"
                        size="md"
                        styles={{ input: { fontFamily: 'inherit' } }}
                        value={d.body}
                        onChange={(e) => setDraft((prev) => (prev ? { ...prev, body: e.currentTarget.value } : prev))}
                    />
                    <Group justify="flex-end" mt="sm">
                        <Button
                            variant="default"
                            onClick={() => {
                                setDraft(null);
                                modals.close('notice-draft-modal');
                            }}
                        >
                            취소
                        </Button>
                        <Button onClick={submitDraft}>{isEdit ? '수정' : '생성'}</Button>
                    </Group>
                </Stack>
            )
        });
    }

    return (
        <PageContainer>
            <Group justify="space-between" mb="md">
                <PageHeader description="서비스 업데이트 및 점검 안내" title="공지사항" />
                <Button size="xs" variant="light" onClick={openCreate}>
                    새 공지 작성
                </Button>
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
                        </Group>
                    </Card>
                ))}
            </Stack>
        </PageContainer>
    );
}

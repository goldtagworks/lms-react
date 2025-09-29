import { useState, useEffect } from 'react';
import { TextInput, Textarea, Switch, Group, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { addNotice, updateNotice } from '@main/lib/noticeRepo';
import { Save, X } from 'lucide-react';

export interface NoticeEditorProps {
    noticeId?: string;
    initialTitle?: string;
    initialBody?: string;
    initialPinned?: boolean;
    onSaved?: (id: string) => void;
    onCancel?: () => void;
}

/**
 * 공지 작성/수정 공용 에디터 컴포넌트
 * - 모달/페이지 어디서나 재사용 가능
 */
export default function NoticeEditor({ noticeId, initialTitle = '', initialBody = '', initialPinned = false, onSaved, onCancel }: NoticeEditorProps) {
    const isEdit = !!noticeId;
    const [title, setTitle] = useState(initialTitle);
    const [body, setBody] = useState(initialBody);
    const [pinned, setPinned] = useState(initialPinned);

    useEffect(() => {
        setTitle(initialTitle);
        setBody(initialBody);
        setPinned(initialPinned);
    }, [initialTitle, initialBody, initialPinned]);

    function handleSubmit() {
        if (!title.trim()) {
            notifications.show({ color: 'red', title: '검증 오류', message: '제목은 필수입니다' });

            return;
        }

        try {
            if (isEdit && noticeId) {
                updateNotice(noticeId, { title: title.trim(), body: body.trim(), pinned });
                notifications.show({ color: 'teal', title: '성공', message: '공지 수정 완료' });
                onSaved?.(noticeId);
            } else {
                const n = addNotice({ title: title.trim(), body: body.trim(), pinned });

                notifications.show({ color: 'teal', title: '성공', message: '공지 생성 완료' });
                onSaved?.(n.id);
            }
        } catch {
            notifications.show({ color: 'red', title: '오류', message: '저장 실패' });
        }
    }

    return (
        <Stack gap="md" mt="sm">
            <TextInput data-autofocus label="제목" placeholder="공지 제목" size="sm" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
            <Textarea
                autosize
                label="본문"
                maxRows={30}
                minRows={10}
                placeholder="공지 본문"
                size="sm"
                styles={{ input: { fontFamily: 'inherit' } }}
                value={body}
                onChange={(e) => setBody(e.currentTarget.value)}
            />
            <Switch checked={pinned} label="상단 고정(PIN)" onChange={(e) => setPinned(e.currentTarget.checked)} />
            <Group justify="flex-end" mt="sm">
                <Button leftSection={<Save size={16} />} size="sm" onClick={handleSubmit}>
                    {isEdit ? '수정' : '생성'}
                </Button>
                <Button leftSection={<X size={16} />} size="sm" variant="default" onClick={onCancel}>
                    취소
                </Button>
            </Group>
        </Stack>
    );
}

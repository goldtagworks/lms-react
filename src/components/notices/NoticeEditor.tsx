import { useState, useEffect } from 'react';
import { TextInput, Textarea, Switch, Group, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNoticeMutations } from '@main/hooks/useNoticeMutations';
import { Save, X } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';

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
    const { t } = useI18n();

    useEffect(() => {
        setTitle(initialTitle);
        setBody(initialBody);
        setPinned(initialPinned);
    }, [initialTitle, initialBody, initialPinned]);

    const { create, update } = useNoticeMutations();

    function handleSubmit() {
        if (!title.trim()) {
            notifications.show({ color: 'red', title: t('notify.error.validation'), message: t('errors.noticeTitleRequired') });

            return;
        }
        if (isEdit && noticeId) {
            update.mutate(
                { id: noticeId, title: title.trim(), body: body.trim(), pinned },
                {
                    onSuccess: (n: any) => {
                        notifications.show({ color: 'teal', title: t('notify.success.generic'), message: t('notify.success.noticeUpdate') });
                        onSaved?.(n.id);
                    },
                    onError: () => notifications.show({ color: 'red', title: t('notify.error.generic'), message: t('notify.error.saveFailed') })
                }
            );
        } else {
            create.mutate(
                { title: title.trim(), body: body.trim(), pinned },
                {
                    onSuccess: (n: any) => {
                        notifications.show({ color: 'teal', title: t('notify.success.generic'), message: t('notify.success.noticeCreate') });
                        onSaved?.(n.id);
                    },
                    onError: () => notifications.show({ color: 'red', title: t('notify.error.generic'), message: t('notify.error.saveFailed') })
                }
            );
        }
    }

    return (
        <Stack gap="md" mt="sm">
            <TextInput data-autofocus label={t('notice.titleLabel')} placeholder={t('notice.titlePlaceholder')} size="sm" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
            <Textarea
                autosize
                label={t('notice.bodyLabel')}
                maxRows={30}
                minRows={10}
                placeholder={t('notice.bodyPlaceholder')}
                size="sm"
                styles={{ input: { fontFamily: 'inherit' } }}
                value={body}
                onChange={(e) => setBody(e.currentTarget.value)}
            />
            <Switch checked={pinned} label={t('notice.pin')} onChange={(e) => setPinned(e.currentTarget.checked)} />
            <Group justify="flex-end" mt="sm">
                <Button leftSection={<Save size={16} />} size="sm" onClick={handleSubmit}>
                    {isEdit ? t('common.edit') : t('common.submit')}
                </Button>
                <Button leftSection={<X size={16} />} size="sm" variant="default" onClick={onCancel}>
                    {t('common.cancel')}
                </Button>
            </Group>
        </Stack>
    );
}

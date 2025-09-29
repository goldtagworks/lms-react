import type { Lesson } from '@main/types/lesson';

import { Save, X } from 'lucide-react';
import { Modal, Stack, TextInput, SegmentedControl, NumberInput, Textarea, Group, Button } from '@mantine/core';
import { useI18n } from '@main/lib/i18n';
import { useEffect, useState, useCallback } from 'react';

import { YOUTUBE_REGEX } from './constants';
import { formatAttachments, parseAttachments, validateLessonTitle, validateDuration } from './validation';

export interface LessonEditDraft {
    title: string;
    videoType: 'none' | 'youtube' | 'cdn';
    url: string;
    duration: number;
    content: string;
    attachments: string;
}

function deriveVideoType(url?: string | null): LessonEditDraft['videoType'] {
    if (!url) return 'none';

    return YOUTUBE_REGEX.test(url) ? 'youtube' : 'cdn';
}

export interface LessonEditModalProps {
    lesson: Lesson | null;
    opened: boolean;
    onClose(): void;
    onSave(updated: Partial<Lesson> & { id: string }): void; // parent handles persistence
}

export default function LessonEditModal({ lesson, opened, onClose, onSave }: LessonEditModalProps) {
    const { t } = useI18n();
    const [draft, setDraft] = useState<LessonEditDraft | null>(null);

    // Initialize draft when lesson changes or opened
    useEffect(() => {
        if (lesson && opened) {
            setDraft({
                title: lesson.title,
                videoType: deriveVideoType(lesson.content_url),
                url: lesson.content_url || '',
                duration: lesson.duration_seconds || 0,
                content: lesson.content_md || '',
                attachments: formatAttachments(lesson.attachments)
            });
        } else if (!lesson || !opened) {
            setDraft(null);
        }
    }, [lesson, opened]);

    const handleSave = useCallback(() => {
        if (!lesson || !draft) return;
        const t = draft.title.trim();

        if (validateLessonTitle(t)) return;
        if (!lesson.is_section && validateDuration(draft.duration)) return;
        let attachmentsArr: string[] | undefined = lesson.is_section ? undefined : parseAttachments(draft.attachments);

        const patch: Partial<Lesson> & { id: string } = {
            id: lesson.id,
            title: t,
            content_url: lesson.is_section ? undefined : draft.videoType === 'none' ? undefined : draft.url.trim(),
            duration_seconds: lesson.is_section ? 0 : draft.duration || 0,
            content_md: lesson.is_section ? undefined : draft.content.trim() || undefined,
            attachments: attachmentsArr,
            updated_at: new Date().toISOString()
        };

        onSave(patch);
        onClose();
    }, [lesson, draft, onClose, onSave]);

    function body() {
        if (!lesson || !draft) return null;

        return (
            <Stack gap="sm" mt="xs">
                <TextInput
                    label={t('lesson.edit.field.title')}
                    size="sm"
                    value={draft.title}
                    onChange={(e) => {
                        const val = e.currentTarget.value;

                        setDraft((d) => (d ? { ...d, title: val } : d));
                    }}
                />
                {!lesson.is_section && (
                    <>
                        <SegmentedControl
                            fullWidth
                            data={[
                                { label: t('lesson.edit.videoType.none'), value: 'none' },
                                { label: t('lesson.edit.videoType.youtube'), value: 'youtube' },
                                { label: t('lesson.edit.videoType.cdn'), value: 'cdn' }
                            ]}
                            value={draft.videoType}
                            onChange={(v: any) => setDraft((d) => (d ? { ...d, videoType: v } : d))}
                        />
                        {draft.videoType !== 'none' && (
                            <TextInput
                                label={draft.videoType === 'youtube' ? t('lesson.edit.field.youtubeUrl') : t('lesson.edit.field.url')}
                                placeholder={draft.videoType === 'youtube' ? t('lesson.edit.placeholder.youtube') : t('lesson.edit.placeholder.url')}
                                size="sm"
                                value={draft.url}
                                onChange={(e) => {
                                    const val = e.currentTarget.value;

                                    setDraft((d) => (d ? { ...d, url: val } : d));
                                }}
                            />
                        )}
                        <NumberInput label={t('lesson.edit.field.durationSeconds')} min={0} value={draft.duration} onChange={(v) => setDraft((d) => (d ? { ...d, duration: Number(v) || 0 } : d))} />
                        <Textarea
                            label={t('lesson.edit.field.content')}
                            minRows={4}
                            placeholder={t('lesson.edit.placeholder.content')}
                            size="sm"
                            value={draft.content}
                            onChange={(e) => {
                                const val = e.currentTarget.value;

                                setDraft((d) => (d ? { ...d, content: val } : d));
                            }}
                        />
                        <TextInput
                            label={t('lesson.edit.field.attachments')}
                            placeholder={t('lesson.edit.placeholder.attachments')}
                            size="sm"
                            value={draft.attachments}
                            onChange={(e) => {
                                const val = e.currentTarget.value;

                                setDraft((d) => (d ? { ...d, attachments: val } : d));
                            }}
                        />
                    </>
                )}
                <Group justify="flex-end" mt="sm">
                    <Button aria-label={t('common.save')} leftSection={<Save size={16} />} size="sm" onClick={handleSave}>
                        {t('common.save')}
                    </Button>
                    <Button aria-label={t('common.close')} leftSection={<X size={16} />} size="sm" variant="default" onClick={onClose}>
                        {t('common.close')}
                    </Button>
                </Group>
            </Stack>
        );
    }

    return (
        <Modal centered withinPortal opened={opened && !!lesson} radius="md" size="lg" title={t(lesson?.is_section ? 'lesson.edit.sectionTitle' : 'lesson.edit.title')} onClose={onClose}>
            {body()}
        </Modal>
    );
}

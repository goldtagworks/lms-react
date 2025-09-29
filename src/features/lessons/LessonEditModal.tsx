import type { Lesson } from '@main/types/lesson';

import { Save, X } from 'lucide-react';
import { Modal, Stack, TextInput, SegmentedControl, NumberInput, Textarea, Group, Button } from '@mantine/core';
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
                    label="제목"
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
                                { label: '영상 없음', value: 'none' },
                                { label: 'YouTube', value: 'youtube' },
                                { label: 'CDN/기타', value: 'cdn' }
                            ]}
                            value={draft.videoType}
                            onChange={(v: any) => setDraft((d) => (d ? { ...d, videoType: v } : d))}
                        />
                        {draft.videoType !== 'none' && (
                            <TextInput
                                label={draft.videoType === 'youtube' ? 'YouTube URL' : '영상 URL'}
                                placeholder={draft.videoType === 'youtube' ? 'https://youtu.be/...' : 'https://cdn.example.com/video.mp4'}
                                size="sm"
                                value={draft.url}
                                onChange={(e) => {
                                    const val = e.currentTarget.value;

                                    setDraft((d) => (d ? { ...d, url: val } : d));
                                }}
                            />
                        )}
                        <NumberInput label="길이(초)" min={0} value={draft.duration} onChange={(v) => setDraft((d) => (d ? { ...d, duration: Number(v) || 0 } : d))} />
                        <Textarea
                            label="본문(Markdown)"
                            minRows={4}
                            placeholder="# 제목\n내용 ..."
                            size="sm"
                            value={draft.content}
                            onChange={(e) => {
                                const val = e.currentTarget.value;

                                setDraft((d) => (d ? { ...d, content: val } : d));
                            }}
                        />
                        <TextInput
                            label="첨부 (쉼표 구분)"
                            placeholder="file1.pdf, link2"
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
                    <Button leftSection={<Save size={16} />} size="sm" onClick={handleSave}>
                        저장
                    </Button>
                    <Button leftSection={<X size={16} />} size="sm" variant="default" onClick={onClose}>
                        닫기
                    </Button>
                </Group>
            </Stack>
        );
    }

    return (
        <Modal centered withinPortal opened={opened && !!lesson} radius="md" size="lg" title="레슨 편집" onClose={onClose}>
            {body()}
        </Modal>
    );
}

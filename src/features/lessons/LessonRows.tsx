import type { Lesson } from '@main/types/lesson';

import { ActionIcon, Badge, Group, Text, TextInput } from '@mantine/core';
import { Check, Pencil, PenSquare, Star, StarOff, Trash2, X, GripVertical } from 'lucide-react';
import { memo, useCallback, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useI18n } from '@main/lib/i18n';
import { useEnterSpace } from '@main/hooks/useEnterSpace';

import { YOUTUBE_REGEX } from './constants';

export interface BaseRowHandlers {
    onEdit(lesson: Lesson): void;
    onDelete(id: string): void;
    onMove(id: string, dir: 'up' | 'down'): void;
}

export interface LessonRowHandlers extends BaseRowHandlers {
    onTogglePreview(id: string): void;
}

interface RenameSharedProps {
    renamingId?: string | null;
    renameDraft?: string;
    onStartRename?(lesson: Lesson): void;
    onRenameChange?(v: string): void;
    onRenameCancel?(): void;
    onRenameCommit?(): void;
}

interface SectionRowProps extends BaseRowHandlers, RenameSharedProps {
    lesson: Lesson; // is_section=true 보장
    index: number; // absolute index in ordered list (이동/비활성 제어 용)
    total: number;
    displayIndex: number; // 섹션 번호 (1부터)
}

interface LessonRowProps extends LessonRowHandlers, RenameSharedProps {
    lesson: Lesson; // is_section=false 보장
    index: number; // absolute index in ordered list
    total: number;
    displayIndex: number | string; // 블록 내부 레슨 번호 또는 '섹션-레슨'
}

export const SectionRow = memo(function SectionRow({
    lesson,
    index: _index,
    total: _total,
    displayIndex,
    onEdit,
    onDelete,
    onMove: _onMove,
    renamingId,
    renameDraft,
    onStartRename,
    onRenameChange,
    onRenameCancel,
    onRenameCommit
}: SectionRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: lesson.id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const handleEdit = useCallback(() => onEdit(lesson), [lesson, onEdit]);
    const keyHandler = useEnterSpace(handleEdit);
    const isRenaming = renamingId === lesson.id;
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const { t } = useI18n();

    return (
        <Group
            key={lesson.id}
            ref={setNodeRef}
            gap={6}
            style={{
                backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))',
                ...style
            }}
            wrap="nowrap"
        >
            <Badge color="gray" size="sm" variant="outline">
                {t('a11y.lesson.section.label')}
            </Badge>
            <ActionIcon aria-label={t('a11y.lesson.section.dragHandle')} size="sm" style={{ cursor: 'grab' }} variant="subtle" {...attributes} {...listeners}>
                <GripVertical size={16} />
            </ActionIcon>
            {isRenaming ? (
                <Group flex={1} gap={4} wrap="nowrap">
                    <TextInput
                        ref={inputRef}
                        aria-label={t('a11y.lesson.section.titleInput')}
                        flex={1}
                        size="sm"
                        value={renameDraft}
                        onChange={(e) => onRenameChange?.(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onRenameCommit?.();
                            else if (e.key === 'Escape') onRenameCancel?.();
                        }}
                    />
                    <ActionIcon aria-label={t('a11y.lesson.section.save')} color="teal" variant="light" onClick={() => onRenameCommit?.()}>
                        <Check size={14} />
                    </ActionIcon>
                    <ActionIcon aria-label={t('a11y.lesson.section.cancel')} variant="subtle" onClick={() => onRenameCancel?.()}>
                        <X size={14} />
                    </ActionIcon>
                </Group>
            ) : (
                <Text
                    aria-label={t('a11y.lesson.section.editPrefix', { title: lesson.title })}
                    flex={1}
                    fw={600}
                    role="button"
                    size="sm"
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    onClick={handleEdit}
                    onKeyDown={keyHandler}
                >
                    {displayIndex}. {lesson.title}
                </Text>
            )}
            {!isRenaming && (
                <>
                    <ActionIcon aria-label={t('a11y.lesson.section.rename')} variant="subtle" onClick={() => onStartRename?.(lesson)}>
                        <Pencil size={16} />
                    </ActionIcon>
                    <ActionIcon aria-label={t('a11y.lesson.section.editDetail')} variant="subtle" onClick={handleEdit}>
                        <PenSquare size={16} />
                    </ActionIcon>
                </>
            )}
            <ActionIcon aria-label={t('a11y.lesson.section.delete')} color="red" variant="subtle" onClick={() => onDelete(lesson.id)}>
                <Trash2 size={16} />
            </ActionIcon>
        </Group>
    );
});

export const LessonRow = memo(function LessonRow({
    lesson,
    index: _index,
    total: _total,
    displayIndex,
    onEdit,
    onDelete,
    onMove: _onMove,
    onTogglePreview,
    renamingId,
    renameDraft,
    onStartRename,
    onRenameChange,
    onRenameCancel,
    onRenameCommit
}: LessonRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: lesson.id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const handleEdit = useCallback(() => onEdit(lesson), [lesson, onEdit]);
    const keyHandler = useEnterSpace(handleEdit);
    const videoLabel = lesson.content_url ? (YOUTUBE_REGEX.test(lesson.content_url) ? 'YouTube' : 'Video') : '—';
    const isRenaming = renamingId === lesson.id;
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const { t } = useI18n();

    return (
        <Group key={lesson.id} ref={setNodeRef} gap={4} style={style} wrap="nowrap">
            <ActionIcon
                aria-label={lesson.is_preview ? t('a11y.lesson.preview.unset') : t('a11y.lesson.preview.set')}
                color={lesson.is_preview ? 'yellow' : 'gray'}
                variant="subtle"
                onClick={() => onTogglePreview(lesson.id)}
            >
                {lesson.is_preview ? <Star size={16} /> : <StarOff size={16} />}
            </ActionIcon>
            <ActionIcon aria-label={t('a11y.lesson.lesson.dragHandle')} size="sm" style={{ cursor: 'grab' }} variant="subtle" {...attributes} {...listeners}>
                <GripVertical size={16} />
            </ActionIcon>
            {isRenaming ? (
                <Group flex={1} gap={4} wrap="nowrap">
                    <TextInput
                        ref={inputRef}
                        aria-label={t('a11y.lesson.lesson.titleInput')}
                        flex={1}
                        size="sm"
                        value={renameDraft}
                        onChange={(e) => onRenameChange?.(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onRenameCommit?.();
                            else if (e.key === 'Escape') onRenameCancel?.();
                        }}
                    />
                    <ActionIcon aria-label={t('a11y.lesson.lesson.save')} color="teal" variant="light" onClick={() => onRenameCommit?.()}>
                        <Check size={14} />
                    </ActionIcon>
                    <ActionIcon aria-label={t('a11y.lesson.lesson.cancel')} variant="subtle" onClick={() => onRenameCancel?.()}>
                        <X size={14} />
                    </ActionIcon>
                </Group>
            ) : (
                <Text
                    aria-label={t('a11y.lesson.lesson.editPrefix', { title: lesson.title })}
                    component="div"
                    flex={1}
                    role="button"
                    size="sm"
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    onClick={handleEdit}
                    onKeyDown={keyHandler}
                >
                    {displayIndex}. {lesson.title}{' '}
                    {lesson.is_preview && (
                        <Badge color="teal" size="xs" variant="light">
                            {t('a11y.lesson.preview.badge')}
                        </Badge>
                    )}
                    <Text c="dimmed" component="span" ml={6} size="sm">
                        {videoLabel} {lesson.duration_seconds ? `• ${lesson.duration_seconds}s` : ''}
                    </Text>
                </Text>
            )}
            {!isRenaming && (
                <>
                    <ActionIcon aria-label={t('a11y.lesson.lesson.rename')} variant="subtle" onClick={() => onStartRename?.(lesson)}>
                        <Pencil size={16} />
                    </ActionIcon>
                    <ActionIcon aria-label={t('a11y.lesson.lesson.editDetail')} variant="subtle" onClick={handleEdit}>
                        <PenSquare size={16} />
                    </ActionIcon>
                </>
            )}
            <ActionIcon aria-label={t('a11y.lesson.lesson.delete')} color="red" variant="subtle" onClick={() => onDelete(lesson.id)}>
                <Trash2 size={16} />
            </ActionIcon>
        </Group>
    );
});

import type { Lesson } from '@main/types/lesson';

import { ActionIcon, Badge, Group, Text } from '@mantine/core';
import { ArrowDown, ArrowUp, Pencil, Star, StarOff, Trash2 } from 'lucide-react';
import { memo, useCallback } from 'react';
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

interface SectionRowProps extends BaseRowHandlers {
    lesson: Lesson; // is_section=true 보장
    index: number; // absolute index in ordered list (이동/비활성 제어 용)
    total: number;
    displayIndex: number; // 섹션 번호 (1부터)
}

interface LessonRowProps extends LessonRowHandlers {
    lesson: Lesson; // is_section=false 보장
    index: number; // absolute index in ordered list
    total: number;
    displayIndex: number | string; // 블록 내부 레슨 번호 또는 '섹션-레슨'
}

export const SectionRow = memo(function SectionRow({ lesson, index, total, displayIndex, onEdit, onDelete, onMove }: SectionRowProps) {
    const handleEdit = useCallback(() => onEdit(lesson), [lesson, onEdit]);
    const keyHandler = useEnterSpace(handleEdit);

    return (
        <Group key={lesson.id} gap={6} wrap="nowrap">
            <Badge color="gray" size="sm" variant="outline">
                섹션
            </Badge>
            <ActionIcon aria-label="섹션 위로" disabled={index === 0} variant="subtle" onClick={() => onMove(lesson.id, 'up')}>
                <ArrowUp size={16} />
            </ActionIcon>
            <ActionIcon aria-label="섹션 아래로" disabled={index === total - 1} variant="subtle" onClick={() => onMove(lesson.id, 'down')}>
                <ArrowDown size={16} />
            </ActionIcon>
            <Text aria-label={`섹션 편집: ${lesson.title}`} flex={1} fw={600} role="button" size="sm" style={{ cursor: 'pointer' }} tabIndex={0} onClick={handleEdit} onKeyDown={keyHandler}>
                {displayIndex}. {lesson.title}
            </Text>
            <ActionIcon aria-label="섹션 편집" variant="subtle" onClick={handleEdit}>
                <Pencil size={16} />
            </ActionIcon>
            <ActionIcon aria-label="섹션 삭제" color="red" variant="subtle" onClick={() => onDelete(lesson.id)}>
                <Trash2 size={16} />
            </ActionIcon>
        </Group>
    );
});

export const LessonRow = memo(function LessonRow({ lesson, index, total, displayIndex, onEdit, onDelete, onMove, onTogglePreview }: LessonRowProps) {
    const handleEdit = useCallback(() => onEdit(lesson), [lesson, onEdit]);
    const keyHandler = useEnterSpace(handleEdit);
    const videoLabel = lesson.content_url ? (YOUTUBE_REGEX.test(lesson.content_url) ? 'YouTube' : 'Video') : '—';

    return (
        <Group key={lesson.id} gap={4} wrap="nowrap">
            <ActionIcon aria-label={lesson.is_preview ? '미리보기 해제' : '미리보기 지정'} color={lesson.is_preview ? 'yellow' : 'gray'} variant="subtle" onClick={() => onTogglePreview(lesson.id)}>
                {lesson.is_preview ? <Star size={16} /> : <StarOff size={16} />}
            </ActionIcon>
            <ActionIcon aria-label="위로" disabled={index === 0} variant="subtle" onClick={() => onMove(lesson.id, 'up')}>
                <ArrowUp size={16} />
            </ActionIcon>
            <ActionIcon aria-label="아래로" disabled={index === total - 1} variant="subtle" onClick={() => onMove(lesson.id, 'down')}>
                <ArrowDown size={16} />
            </ActionIcon>
            <Text aria-label={`레슨 편집: ${lesson.title}`} component="div" flex={1} role="button" size="sm" style={{ cursor: 'pointer' }} tabIndex={0} onClick={handleEdit} onKeyDown={keyHandler}>
                {displayIndex}. {lesson.title}{' '}
                {lesson.is_preview && (
                    <Badge color="teal" size="xs" variant="light">
                        미리보기
                    </Badge>
                )}
                <Text c="dimmed" component="span" ml={6} size="xs">
                    {videoLabel} {lesson.duration_seconds ? `• ${lesson.duration_seconds}s` : ''}
                </Text>
            </Text>
            <ActionIcon aria-label="레슨 편집" variant="subtle" onClick={handleEdit}>
                <Pencil size={16} />
            </ActionIcon>
            <ActionIcon aria-label="레슨 삭제" color="red" variant="subtle" onClick={() => onDelete(lesson.id)}>
                <Trash2 size={16} />
            </ActionIcon>
        </Group>
    );
});

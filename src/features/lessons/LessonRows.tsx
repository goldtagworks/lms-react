import type { Lesson } from '@main/types/lesson';

import { ActionIcon, Badge, Group, Text, TextInput } from '@mantine/core';
import { ArrowDown, ArrowUp, Check, Pencil, PenSquare, Star, StarOff, Trash2, X } from 'lucide-react';
import { memo, useCallback, useRef, useEffect } from 'react';
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
    index,
    total,
    displayIndex,
    onEdit,
    onDelete,
    onMove,
    renamingId,
    renameDraft,
    onStartRename,
    onRenameChange,
    onRenameCancel,
    onRenameCommit
}: SectionRowProps) {
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

    return (
        <Group key={lesson.id} gap={6} style={{ backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))' }} wrap="nowrap">
            <Badge color="gray" size="sm" variant="outline">
                섹션
            </Badge>
            <ActionIcon aria-label="섹션 위로" disabled={index === 0} variant="subtle" onClick={() => onMove(lesson.id, 'up')}>
                <ArrowUp size={16} />
            </ActionIcon>
            <ActionIcon aria-label="섹션 아래로" disabled={index === total - 1} variant="subtle" onClick={() => onMove(lesson.id, 'down')}>
                <ArrowDown size={16} />
            </ActionIcon>
            {isRenaming ? (
                <Group flex={1} gap={4} wrap="nowrap">
                    <TextInput
                        ref={inputRef}
                        aria-label="섹션 제목 입력"
                        flex={1}
                        size="sm"
                        value={renameDraft}
                        onChange={(e) => onRenameChange?.(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onRenameCommit?.();
                            else if (e.key === 'Escape') onRenameCancel?.();
                        }}
                    />
                    <ActionIcon aria-label="섹션 이름 저장" color="teal" variant="light" onClick={() => onRenameCommit?.()}>
                        <Check size={14} />
                    </ActionIcon>
                    <ActionIcon aria-label="섹션 이름 취소" variant="subtle" onClick={() => onRenameCancel?.()}>
                        <X size={14} />
                    </ActionIcon>
                </Group>
            ) : (
                <Text aria-label={`섹션 편집: ${lesson.title}`} flex={1} fw={600} role="button" size="sm" style={{ cursor: 'pointer' }} tabIndex={0} onClick={handleEdit} onKeyDown={keyHandler}>
                    {displayIndex}. {lesson.title}
                </Text>
            )}
            {!isRenaming && (
                <>
                    <ActionIcon aria-label="섹션 이름 변경" variant="subtle" onClick={() => onStartRename?.(lesson)}>
                        <Pencil size={16} />
                    </ActionIcon>
                    <ActionIcon aria-label="섹션 상세 편집 (모달)" variant="subtle" onClick={handleEdit}>
                        <PenSquare size={16} />
                    </ActionIcon>
                </>
            )}
            <ActionIcon aria-label="섹션 삭제" color="red" variant="subtle" onClick={() => onDelete(lesson.id)}>
                <Trash2 size={16} />
            </ActionIcon>
        </Group>
    );
});

export const LessonRow = memo(function LessonRow({
    lesson,
    index,
    total,
    displayIndex,
    onEdit,
    onDelete,
    onMove,
    onTogglePreview,
    renamingId,
    renameDraft,
    onStartRename,
    onRenameChange,
    onRenameCancel,
    onRenameCommit
}: LessonRowProps) {
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
            {isRenaming ? (
                <Group flex={1} gap={4} wrap="nowrap">
                    <TextInput
                        ref={inputRef}
                        aria-label="레슨 제목 입력"
                        flex={1}
                        size="sm"
                        value={renameDraft}
                        onChange={(e) => onRenameChange?.(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onRenameCommit?.();
                            else if (e.key === 'Escape') onRenameCancel?.();
                        }}
                    />
                    <ActionIcon aria-label="레슨 이름 저장" color="teal" variant="light" onClick={() => onRenameCommit?.()}>
                        <Check size={14} />
                    </ActionIcon>
                    <ActionIcon aria-label="레슨 이름 취소" variant="subtle" onClick={() => onRenameCancel?.()}>
                        <X size={14} />
                    </ActionIcon>
                </Group>
            ) : (
                <Text aria-label={`레슨 편집: ${lesson.title}`} component="div" flex={1} role="button" size="sm" style={{ cursor: 'pointer' }} tabIndex={0} onClick={handleEdit} onKeyDown={keyHandler}>
                    {displayIndex}. {lesson.title}{' '}
                    {lesson.is_preview && (
                        <Badge color="teal" size="xs" variant="light">
                            미리보기
                        </Badge>
                    )}
                    <Text c="dimmed" component="span" ml={6} size="sm">
                        {videoLabel} {lesson.duration_seconds ? `• ${lesson.duration_seconds}s` : ''}
                    </Text>
                </Text>
            )}
            {!isRenaming && (
                <>
                    <ActionIcon aria-label="레슨 이름 변경" variant="subtle" onClick={() => onStartRename?.(lesson)}>
                        <Pencil size={16} />
                    </ActionIcon>
                    <ActionIcon aria-label="레슨 상세 편집 (모달)" variant="subtle" onClick={handleEdit}>
                        <PenSquare size={16} />
                    </ActionIcon>
                </>
            )}
            <ActionIcon aria-label="레슨 삭제" color="red" variant="subtle" onClick={() => onDelete(lesson.id)}>
                <Trash2 size={16} />
            </ActionIcon>
        </Group>
    );
});

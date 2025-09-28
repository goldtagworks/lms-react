import type { Lesson } from '@main/types/lesson';

import { notifications } from '@mantine/notifications';
import { listLessonsByCourse, createLesson, deleteLesson, moveLesson, updateLesson } from '@main/lib/repository';
import { useCallback, useRef, useState } from 'react';

export interface LessonsStateApi {
    lessons: Lesson[];
    orderedLessons: Lesson[];
    addLesson: (title: string, opts?: { silent?: boolean }) => boolean;
    addSection: (title: string, opts?: { silent?: boolean }) => boolean;
    removeLesson: (id: string, opts?: { silent?: boolean }) => void;
    move: (id: string, dir: 'up' | 'down') => void;
    togglePreview: (id: string) => void;
    patch: (patch: Partial<Lesson> & { id: string }) => void;
}

// repository 기반으로 전환되어 개별 STORAGE_KEY 불필요

export function useLessonsState(courseId?: string): LessonsStateApi {
    const [lessons, setLessons] = useState<Lesson[]>(() => (courseId ? listLessonsByCourse(courseId) : []));

    // repository 기반 persistence (별도 persist noop 제거)

    const orderedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);

    const addLesson = useCallback(
        (title: string, opts?: { silent?: boolean }) => {
            if (!courseId) {
                if (!opts?.silent) notifications.show({ color: 'red', title: '코스 필요', message: '먼저 코스를 저장하세요.' });

                return false;
            }
            try {
                const created = createLesson({ course_id: courseId, title });

                setLessons((prev) => [...prev, created]);
                if (!opts?.silent) notifications.show({ color: 'teal', title: '레슨 추가', message: '레슨이 추가되었습니다.' });

                return true;
            } catch {
                if (!opts?.silent) notifications.show({ color: 'red', title: '오류', message: '레슨 추가 실패' });

                return false;
            }
        },
        [courseId]
    );

    const addSection = useCallback(
        (title: string, opts?: { silent?: boolean }) => {
            if (!courseId) {
                if (!opts?.silent) notifications.show({ color: 'red', title: '코스 필요', message: '먼저 코스를 저장하세요.' });

                return false;
            }
            try {
                const created = createLesson({ course_id: courseId, title, is_section: true });

                setLessons((prev) => [...prev, created]);
                if (!opts?.silent) notifications.show({ color: 'teal', title: '섹션 추가', message: '섹션 헤더가 추가되었습니다.' });

                return true;
            } catch {
                if (!opts?.silent) notifications.show({ color: 'red', title: '오류', message: '섹션 추가 실패' });

                return false;
            }
        },
        [courseId]
    );

    const removeLesson = useCallback((id: string, opts?: { silent?: boolean }) => {
        deleteLesson(id);
        setLessons((prev) => prev.filter((l) => l.id !== id));
        if (!opts?.silent) notifications.show({ color: 'teal', title: '삭제 완료', message: '레슨이 삭제되었습니다.' });
    }, []);

    const move = useCallback(
        (id: string, dir: 'up' | 'down') => {
            moveLesson(id, dir);
            // 재로드 (단순화)
            if (courseId) setLessons(listLessonsByCourse(courseId));
        },
        [courseId]
    );

    const lastPreviewNotifRef = useRef<{ type: 'set' | 'unset'; at: number } | null>(null);

    const togglePreview = useCallback((lessonId: string) => {
        setLessons((prev) => {
            const target = prev.find((l) => l.id === lessonId);

            if (!target) return prev;
            const willUnset = target.is_preview;
            const next = prev.map((l) => ({ ...l, is_preview: willUnset ? false : l.id === lessonId }));
            // persist each updated

            next.forEach((l) => updateLesson({ id: l.id, is_preview: l.is_preview } as any));
            queueMicrotask(() => {
                const type: 'set' | 'unset' = willUnset ? 'unset' : 'set';
                const now = Date.now();
                const last = lastPreviewNotifRef.current;

                if (!last || last.type !== type || now - last.at > 300) {
                    notifications.show({
                        color: type === 'set' ? 'teal' : 'gray',
                        title: type === 'set' ? '미리보기 지정' : '미리보기 해제',
                        message: type === 'set' ? '레슨이 미리보기로 지정됨' : '미리보기 해제됨'
                    });
                    lastPreviewNotifRef.current = { type, at: now };
                }
            });

            return next;
        });
    }, []);

    const patch = useCallback((p: Partial<Lesson> & { id: string }) => {
        updateLesson(p as any);
        setLessons((prev) => prev.map((l) => (l.id === p.id ? { ...l, ...p } : l)));
        notifications.show({ color: 'teal', title: '레슨 수정', message: '저장되었습니다.' });
    }, []);

    return { lessons, orderedLessons, addLesson, addSection, removeLesson, move, togglePreview, patch };
}

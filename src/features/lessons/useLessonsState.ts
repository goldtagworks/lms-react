import type { Lesson } from '@main/types/lesson';

import { notifications } from '@mantine/notifications';
import { listLessonsByCourse } from '@main/lib/repository';
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

// sessionStorage key 상수화
const STORAGE_KEY = 'lms_lessons_v1';

export function useLessonsState(courseId?: string): LessonsStateApi {
    const [lessons, setLessons] = useState<Lesson[]>(() => (courseId ? listLessonsByCourse(courseId) : []));

    const persist = useCallback((next: Lesson[]) => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
    }, []);

    const orderedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);

    const addLesson = useCallback(
        (title: string, opts?: { silent?: boolean }) => {
            if (!courseId) {
                if (!opts?.silent) notifications.show({ color: 'red', title: '코스 필요', message: '먼저 코스를 저장하세요.' });

                return false;
            }

            const ttl = title.trim();

            if (!ttl) return false;

            const now = new Date().toISOString();
            const lesson: Lesson = {
                id: 'l-' + Date.now().toString(36),
                course_id: courseId,
                title: ttl,
                outline: undefined,
                content_md: undefined,
                content_url: undefined,
                attachments: undefined,
                duration_seconds: 0,
                order_index: lessons.length + 1,
                is_preview: false,
                created_at: now,
                updated_at: now
            };

            setLessons((prev) => {
                const next = [...prev, lesson];

                persist(next);

                return next;
            });

            if (!opts?.silent) notifications.show({ color: 'teal', title: '레슨 추가', message: '레슨이 추가되었습니다.' });

            return true;
        },
        [courseId, lessons.length, persist]
    );

    const addSection = useCallback(
        (title: string, opts?: { silent?: boolean }) => {
            if (!courseId) {
                if (!opts?.silent) notifications.show({ color: 'red', title: '코스 필요', message: '먼저 코스를 저장하세요.' });

                return false;
            }

            const ttl = title.trim();

            if (!ttl) return false;

            const now = new Date().toISOString();
            const section: Lesson = {
                id: 'sec-' + Date.now().toString(36),
                course_id: courseId,
                title: ttl,
                outline: undefined,
                content_md: undefined,
                content_url: undefined,
                attachments: undefined,
                duration_seconds: 0,
                order_index: lessons.length + 1,
                is_preview: false,
                created_at: now,
                updated_at: now,
                is_section: true
            };

            setLessons((prev) => {
                const next = [...prev, section];

                persist(next);

                return next;
            });

            if (!opts?.silent) notifications.show({ color: 'teal', title: '섹션 추가', message: '섹션 헤더가 추가되었습니다.' });

            return true;
        },
        [courseId, lessons.length, persist]
    );

    const removeLesson = useCallback(
        (id: string, opts?: { silent?: boolean }) => {
            setLessons((prev) => {
                const next = prev.filter((l) => l.id !== id);

                persist(next);

                return next;
            });

            if (!opts?.silent) notifications.show({ color: 'teal', title: '삭제 완료', message: '레슨이 삭제되었습니다.' });
        },
        [persist]
    );

    const move = useCallback(
        (id: string, dir: 'up' | 'down') => {
            setLessons((prev) => {
                const idx = prev.findIndex((l) => l.id === id);

                if (idx < 0) return prev;

                const target = dir === 'up' ? idx - 1 : idx + 1;

                if (target < 0 || target >= prev.length) return prev;

                const copy = [...prev];

                [copy[idx], copy[target]] = [copy[target], copy[idx]];
                copy.forEach((l, i) => (l.order_index = i + 1));
                persist(copy);

                return copy;
            });
        },
        [persist]
    );

    const lastPreviewNotifRef = useRef<{ type: 'set' | 'unset'; at: number } | null>(null);

    const togglePreview = useCallback(
        (lessonId: string) => {
            setLessons((prev) => {
                const target = prev.find((l) => l.id === lessonId);

                if (!target) return prev;

                const willUnset = target.is_preview;
                const next = prev.map((l) => ({ ...l, is_preview: willUnset ? false : l.id === lessonId }));

                persist(next);

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
        },
        [persist]
    );

    const patch = useCallback(
        (patch: Partial<Lesson> & { id: string }) => {
            setLessons((prev) => {
                const next = prev.map((l) => (l.id === patch.id ? { ...l, ...patch, updated_at: new Date().toISOString() } : l));

                persist(next);

                return next;
            });

            notifications.show({ color: 'teal', title: '레슨 수정', message: '저장되었습니다.' });
        },
        [persist]
    );

    return { lessons, orderedLessons, addLesson, addSection, removeLesson, move, togglePreview, patch };
}

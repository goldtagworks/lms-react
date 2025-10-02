import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';

export interface LessonWithProgress {
    id: string;
    course_id: string;
    title: string;
    content_md: string | null;
    content_url: string | null;
    duration_seconds: number;
    order_index: number;
    is_section: boolean;
    is_preview: boolean;
    // Progress info (from enrollment_progress if available)
    is_completed?: boolean;
    completed_at?: string | null;
}

interface ProgressData {
    lesson_id: string;
    is_completed: boolean;
    completed_at: string | null;
}

/**
 * 단일 레슨 조회 (enrollment 진도 포함)
 */
export function useLessonWithProgress(lessonId: string, enrollmentId?: string) {
    return useQuery({
        queryKey: ['lesson', lessonId, 'progress', enrollmentId],
        queryFn: async (): Promise<LessonWithProgress> => {
            // 1. 레슨 기본 정보 조회
            const { data: lesson, error: lessonError } = await supabase.from('lessons').select('*').eq('id', lessonId).single();

            if (lessonError) throw lessonError;
            if (!lesson) throw new Error('Lesson not found');

            // 2. 진도 정보 조회 (enrollmentId가 있는 경우)
            let progressData: ProgressData | null = null;

            if (enrollmentId) {
                const { data: progress } = await supabase
                    .from('enrollment_progress')
                    .select('lesson_id, is_completed, completed_at')
                    .eq('enrollment_id', enrollmentId)
                    .eq('lesson_id', lessonId)
                    .maybeSingle();

                progressData = progress;
            }

            return {
                ...lesson,
                is_completed: progressData?.is_completed || false,
                completed_at: progressData?.completed_at || null
            };
        },
        enabled: !!lessonId
    });
}

/**
 * 코스의 모든 레슨 조회 (enrollment 진도 포함)
 */
export function useCourseProgressLessons(courseId: string, enrollmentId?: string) {
    return useQuery({
        queryKey: ['lessons', courseId, 'progress', enrollmentId],
        queryFn: async (): Promise<LessonWithProgress[]> => {
            // 1. 코스의 모든 레슨 조회
            const { data: lessons, error: lessonsError } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('order_index');

            if (lessonsError) throw lessonsError;
            if (!lessons) return [];

            // 2. 진도 정보 조회 (enrollmentId가 있는 경우)
            let progressMap: Record<string, { is_completed: boolean; completed_at: string | null }> = {};

            if (enrollmentId) {
                const { data: progressList } = await supabase.from('enrollment_progress').select('lesson_id, is_completed, completed_at').eq('enrollment_id', enrollmentId);

                if (progressList) {
                    progressMap = progressList.reduce(
                        (acc, p) => {
                            acc[p.lesson_id] = {
                                is_completed: p.is_completed,
                                completed_at: p.completed_at
                            };

                            return acc;
                        },
                        {} as typeof progressMap
                    );
                }
            }

            // 3. 레슨과 진도 정보 결합
            return lessons.map((lesson) => ({
                ...lesson,
                is_completed: progressMap[lesson.id]?.is_completed || false,
                completed_at: progressMap[lesson.id]?.completed_at || null
            }));
        },
        enabled: !!courseId
    });
}

/**
 * 레슨 완료 상태 업데이트
 */
export function useMarkLessonComplete() {
    return async (enrollmentId: string, lessonId: string): Promise<void> => {
        const { error } = await supabase.from('enrollment_progress').upsert(
            {
                enrollment_id: enrollmentId,
                lesson_id: lessonId,
                is_completed: true,
                completed_at: new Date().toISOString()
            },
            {
                onConflict: 'enrollment_id,lesson_id'
            }
        );

        if (error) throw error;
    };
}

import type { CourseQuestion, CourseAnswer } from '@main/types/qna';

import { useState } from 'react';
import { useCourseQuestionsState, useAnswersState } from '@main/lib/repository'; // legacy list (삭제 예정)
import { supabase } from '@main/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useCourseQuestions(courseId: string | undefined, opts?: { page?: number; pageSize?: number; viewerId?: string }) {
    const { page = 1, pageSize = 10, viewerId } = opts || {};
    const raw = useCourseQuestionsState(courseId);
    // filter: private questions only visible to owner for now (policy: instructors/admin can later see all if needed)
    const list = raw.filter((q: any) => !q.is_private || q.user_id === viewerId);
    const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
    const current = Math.min(Math.max(1, page), pageCount);
    const start = (current - 1) * pageSize;
    const paged = list.slice(start, start + pageSize);

    return {
        questions: paged,
        total: list.length,
        page: current,
        pageCount,
        pageSize
    };
}

export function useQuestionAnswers(questionId: string | undefined) {
    const answers = useAnswersState(questionId);

    return { answers };
}

export function useAskQuestion(courseId: string | undefined, userId: string | undefined) {
    const [error, setError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const mutate = async (title: string, body: string): Promise<CourseQuestion | undefined> => {
        setError(undefined);
        if (!courseId || !userId) return undefined;
        setLoading(true);
        try {
            const { data, error: err } = await supabase.from('course_questions').insert({ course_id: courseId, user_id: userId, title, body }).select('*').single();

            if (err) throw err;
            queryClient.invalidateQueries({ queryKey: ['qna'] });

            return data as CourseQuestion;
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        } finally {
            setLoading(false);
        }
    };

    return { mutate, error, loading } as const;
}

export function useUpdateQuestion(userId: string | undefined) {
    const [error, setError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const mutate = async (questionId: string, title: string, body: string): Promise<CourseQuestion | undefined> => {
        setError(undefined);
        if (!userId) return undefined;
        setLoading(true);
        try {
            const { data, error: err } = await supabase
                .from('course_questions')
                .update({ title, body })
                .eq('id', questionId)
                .eq('user_id', userId) // 자신의 질문만 수정
                .select('*')
                .single();

            if (err) throw err;
            queryClient.invalidateQueries({ queryKey: ['qna'] });

            return data as CourseQuestion;
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        } finally {
            setLoading(false);
        }
    };

    return { mutate, error, loading } as const;
}

// privacy 관련 필드는 현재 스키마 미지원 → 훅 제거/주석 처리 가능 (no-op)
export function useQuestionPrivacy() {
    return { mutate: async () => undefined, error: undefined } as const;
}

export function useAnswerQuestion(questionId: string | undefined, userId: string | undefined, isInstructor: boolean) {
    const [error, setError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const mutate = async (body: string): Promise<CourseAnswer | undefined> => {
        setError(undefined);
        if (!questionId || !userId) return undefined;
        setLoading(true);
        try {
            const { data, error: err } = await supabase.from('course_answers').insert({ question_id: questionId, user_id: userId, body, is_instructor_answer: isInstructor }).select('*').single();

            if (err) throw err;
            queryClient.invalidateQueries({ queryKey: ['qna'] });

            return data as CourseAnswer;
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        } finally {
            setLoading(false);
        }
    };

    return { mutate, error, loading } as const;
}

export function useResolveQuestion(userRole: string | undefined) {
    const [error, setError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();
    const mutate = async (questionId: string): Promise<CourseQuestion | undefined> => {
        setError(undefined);
        if (!userRole || (userRole !== 'instructor' && userRole !== 'admin')) return undefined;
        setLoading(true);
        try {
            const { data, error: err } = await supabase.from('course_questions').update({ is_resolved: true }).eq('id', questionId).select('*').single();

            if (err) throw err;
            queryClient.invalidateQueries({ queryKey: ['qna'] });

            return data as CourseQuestion;
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        } finally {
            setLoading(false);
        }
    };

    return { mutate, error, loading } as const;
}

import type { CourseQuestion, CourseAnswer } from '@main/types/qna';

import { useState } from 'react';
import { useCourseQuestionsState, useAnswersState, createQuestion, createAnswer, resolveQuestion, updateQuestion, setQuestionPrivacy } from '@main/lib/repository';

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
    const mutate = (title: string, body: string, isPrivate?: boolean): CourseQuestion | undefined => {
        setError(undefined);
        if (!courseId || !userId) return undefined;
        try {
            return createQuestion({ course_id: courseId, user_id: userId, title, body, is_private: !!isPrivate });
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        }
    };

    return { mutate, error };
}

export function useUpdateQuestion(userId: string | undefined) {
    const [error, setError] = useState<string | undefined>();
    const mutate = (questionId: string, title: string, body: string): CourseQuestion | undefined => {
        setError(undefined);
        if (!userId) return undefined;
        try {
            return updateQuestion({ question_id: questionId, user_id: userId, title, body });
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        }
    };

    return { mutate, error };
}

export function useQuestionPrivacy(userId: string | undefined) {
    const [error, setError] = useState<string | undefined>();
    const mutate = (questionId: string, isPrivate: boolean): CourseQuestion | undefined => {
        setError(undefined);
        if (!userId) return undefined;
        try {
            return setQuestionPrivacy({ question_id: questionId, user_id: userId, is_private: isPrivate });
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        }
    };

    return { mutate, error };
}

export function useAnswerQuestion(questionId: string | undefined, userId: string | undefined, isInstructor: boolean) {
    const [error, setError] = useState<string | undefined>();
    const mutate = (body: string): CourseAnswer | undefined => {
        setError(undefined);
        if (!questionId || !userId) return undefined;
        try {
            return createAnswer({ question_id: questionId, user_id: userId, body, is_instructor_answer: isInstructor });
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        }
    };

    return { mutate, error };
}

export function useResolveQuestion(userRole: string | undefined) {
    const [error, setError] = useState<string | undefined>();
    const mutate = (questionId: string): CourseQuestion | undefined => {
        setError(undefined);
        if (!userRole || (userRole !== 'instructor' && userRole !== 'admin')) return undefined;
        try {
            return resolveQuestion(questionId);
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        }
    };

    return { mutate, error };
}

import type { CourseReview } from '@main/types/review';

import { useMemo, useState } from 'react';
import { useCourseReviewsState, useCourseRatingSummaryState } from '@main/lib/repository'; // legacy (삭제 예정)
import { supabase } from '@main/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@main/lib/queryKeys';

export type ReviewSort = 'latest' | 'ratingHigh' | 'ratingLow';

interface UseCourseReviewsOptions {
    pageSize?: number;
    sort?: ReviewSort;
    page?: number;
}

/**
 * @deprecated 표준 페이지네이션 훅(useCourseReviewsPaged)으로 대체되었습니다.
 *  - 새 코드에서는 useCourseReviewsPaged + PaginatedResult 패턴 사용
 *  - summary 값만 필요한 경우 useCourseRatingSummaryState 사용
 */
export function useCourseReviews(courseId: string | undefined, opts?: UseCourseReviewsOptions) {
    const { pageSize = 10, sort = 'latest', page = 1 } = opts || {};
    const list = useCourseReviewsState(courseId);
    const summary = useCourseRatingSummaryState(courseId);

    const sorted = useMemo(() => {
        const arr = [...list];

        switch (sort) {
            case 'ratingHigh':
                return arr.sort((a, b) => b.rating - a.rating || (a.created_at < b.created_at ? 1 : -1));
            case 'ratingLow':
                return arr.sort((a, b) => a.rating - b.rating || (a.created_at < b.created_at ? 1 : -1));
            default:
                return arr.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        }
    }, [list, sort]);

    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(Math.max(1, page), pageCount);
    const start = (currentPage - 1) * pageSize;
    const paged = sorted.slice(start, start + pageSize);

    return {
        reviews: paged,
        total: sorted.length,
        page: currentPage,
        pageCount,
        pageSize,
        summary
    };
}

export function useCreateOrUpdateReview(courseId: string | undefined, userId: string | undefined) {
    const [error, setError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const mutate = async (rating: number, comment?: string): Promise<CourseReview | undefined> => {
        setError(undefined);
        if (!courseId || !userId) return undefined;
        setLoading(true);
        try {
            // upsert: UNIQUE(course_id,user_id)
            const { data, error: err } = await supabase
                .from('course_reviews')
                .upsert({ course_id: courseId, user_id: userId, rating, comment }, { onConflict: 'course_id,user_id' })
                .select('*')
                .single();

            if (err) throw err;

            // 관련 캐시 무효화 (페이지네이션 전체 페이지 invalidate: 간단히 key prefix 사용)
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            queryClient.invalidateQueries({ queryKey: qk.course(courseId) }); // 상세에서 메트릭 재계산 훅 예상

            return data as CourseReview;
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        } finally {
            setLoading(false);
        }
    };

    return { mutate, error, loading } as const;
}

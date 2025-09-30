import type { CourseReview } from '@main/types/review';

import { useMemo, useState } from 'react';
import { useCourseReviewsState, useCourseRatingSummaryState, upsertCourseReview } from '@main/lib/repository';

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
    const mutate = (rating: number, comment?: string): CourseReview | undefined => {
        setError(undefined);
        if (!courseId || !userId) return undefined;
        try {
            return upsertCourseReview({ course_id: courseId, user_id: userId, rating, comment });
        } catch (e: any) {
            setError(e?.message || 'ERROR');

            return undefined;
        }
    };

    return { mutate, error };
}

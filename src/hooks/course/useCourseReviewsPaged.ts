import type { PaginatedResult } from '@main/types/pagination';
import type { CourseReview } from '@main/types/review';

import { useMemo } from 'react';
import { useCourseReviewsState } from '@main/lib/repository';

export type ReviewSort = 'latest' | 'ratingHigh' | 'ratingLow';

interface UseCourseReviewsPagedOptions {
    pageSize?: number;
    sort?: ReviewSort;
}

export function useCourseReviewsPaged(courseId: string | undefined, page: number, { pageSize = 10, sort = 'latest' }: UseCourseReviewsPagedOptions = {}) {
    const list = useCourseReviewsState(courseId);

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

    const total = sorted.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items: CourseReview[] = sorted.slice(start, start + pageSize);

    const data: PaginatedResult<CourseReview> = { items, page: safePage, pageSize, total, pageCount };

    return { data } as const;
}

export default useCourseReviewsPaged;

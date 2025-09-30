import type { PaginatedResult } from '@main/types/pagination';
import type { CourseReview } from '@main/types/review';

import { useQuery } from '@tanstack/react-query';
import { qk } from '@main/lib/queryKeys';
import { supabase } from '@main/lib/supabase';

export type ReviewSort = 'latest' | 'ratingHigh' | 'ratingLow';

interface UseCourseReviewsPagedOptions {
    pageSize?: number;
    sort?: ReviewSort;
}

function buildOrder(sort: ReviewSort) {
    switch (sort) {
        case 'ratingHigh':
            return { column: 'rating', ascending: false as const };
        case 'ratingLow':
            return { column: 'rating', ascending: true as const };
        case 'latest':
        default:
            return { column: 'created_at', ascending: false as const };
    }
}

export function useCourseReviewsPaged(courseId: string | undefined, page: number, { pageSize = 10, sort = 'latest' }: UseCourseReviewsPagedOptions = {}) {
    return useQuery({
        queryKey: courseId ? qk.reviews({ courseId, page, pageSize, sort }) : ['reviews', 'disabled'],
        enabled: !!courseId,
        queryFn: async (): Promise<PaginatedResult<CourseReview>> => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            const order = buildOrder(sort);

            // 총 카운트 + 페이지 데이터 동시 조회
            const { data, error, count } = await supabase
                .from('course_reviews')
                .select('*', { count: 'exact' })
                .eq('course_id', courseId!)
                .order(order.column, { ascending: order.ascending })
                .range(from, to);

            if (error) throw error;

            const total = count ?? 0;
            const pageCount = Math.max(1, Math.ceil(total / pageSize));

            return { items: data as CourseReview[], page, pageSize, total, pageCount };
        }
    });
}

export default useCourseReviewsPaged;

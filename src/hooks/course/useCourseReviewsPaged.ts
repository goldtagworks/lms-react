import type { PaginatedResult } from '@main/types/pagination';
import type { CourseReview } from '@main/types/review';

import { useQuery } from '@tanstack/react-query';
import { qk } from '@main/lib/queryKeys';
import { supabase } from '@main/lib/supabase';
import { mapSupabaseError } from '@main/lib/errors';
import { computeRange, buildPagedResult, emptyPage } from '@main/lib/paging';

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
    const enabled = !!courseId;

    return useQuery({
        queryKey: courseId ? qk.reviews({ courseId, page, pageSize, sort }) : ['reviews', 'disabled'],
        enabled,
        queryFn: async (): Promise<PaginatedResult<CourseReview>> => {
            const { from, to } = computeRange(page, pageSize);
            const order = buildOrder(sort);

            try {
                const { data, error, count } = await supabase
                    .from('course_reviews')
                    .select('*', { count: 'exact' })
                    .eq('course_id', courseId!)
                    .order(order.column, { ascending: order.ascending })
                    .range(from, to);

                if (error) throw error;

                return buildPagedResult({ items: (data || []) as CourseReview[], count, page, pageSize });
            } catch (e) {
                throw mapSupabaseError(e);
            }
        },
        placeholderData: !enabled ? emptyPage<CourseReview>(pageSize) : undefined
    });
}

export default useCourseReviewsPaged;

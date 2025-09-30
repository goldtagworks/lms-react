import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { mapSupabaseError } from '@main/lib/errors';
import { qk } from '@main/lib/queryKeys';
import { COURSE_FIELDS_LIST, applyFeaturedOrder, queryPolicy } from '@main/lib/queryPolicy';
import { computeRange, buildPagedResult } from '@main/lib/paging';
import { useDebouncedValue } from '@main/hooks/useDebouncedValue';

export interface CourseListRow {
    id: string;
    title: string;
    description: string | null;
    instructor_id: string;
    pricing_mode: string;
    price_cents: number;
    sale_price_cents: number | null;
    sale_ends_at: string | null;
    tax_included: boolean;
    currency: string;
    level: string | null;
    category_id: string | null;
    thumbnail_url: string | null;
    summary: string | null;
    tags: string[] | null;
    is_featured: boolean;
    featured_rank: number | null;
    featured_badge_text: string | null;
    published: boolean;
    created_at: string;
}

export interface UseCoursesPagedOptions {
    pageSize?: number;
    categoryId?: string;
    q?: string;
    includeUnpublished?: boolean; // 관리자/강사용 옵션 (기본 false)
}

interface FetchParams {
    page: number;
    pageSize: number;
    categoryId?: string;
    q?: string;
    includeUnpublished?: boolean;
}

async function fetchCourses({ page, pageSize, categoryId, q, includeUnpublished }: FetchParams) {
    const { from, to } = computeRange(page, pageSize);
    let query = supabase.from('courses').select(COURSE_FIELDS_LIST, { count: 'exact' });

    if (!includeUnpublished) query = query.eq('published', true);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (q && q.trim()) {
        const pattern = `%${q.trim()}%`;
        // title OR description (description nullable)

        query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
    }

    try {
        const { data, error, count } = await applyFeaturedOrder(query).range(from, to);

        if (error) throw error;

        const items = (data || []) as CourseListRow[];

        return buildPagedResult({ items, count, page, pageSize });
    } catch (e) {
        throw mapSupabaseError(e);
    }
}

export function useCoursesPaged(page: number, { pageSize = 12, categoryId, q, includeUnpublished = false }: UseCoursesPagedOptions = {}) {
    const policy = queryPolicy.courses;
    const debouncedQ = useDebouncedValue(q, 300);
    const query = useQuery({
        queryKey: qk.courses({ page, pageSize, categoryId, q: debouncedQ }),
        queryFn: () => fetchCourses({ page, pageSize, categoryId, q: debouncedQ, includeUnpublished }),
        staleTime: policy.staleTime
        // react-query v5 'gcTime' 옵션 미사용 상태; v4 호환 위해 keepPreviousData 제거
        // 페이지 변경 시 깜빡임 방지를 위해 enabled 제어 or skeleton 전략 별도 적용
    });

    return { data: query.data, isLoading: query.isLoading, error: query.error } as const;
}

export default useCoursesPaged;

import type { PaginatedResult } from '@main/types/pagination';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

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
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
        .from('courses')
        .select(
            'id,title,description,instructor_id,pricing_mode,price_cents,sale_price_cents,sale_ends_at,tax_included,currency,level,category_id,thumbnail_url,summary,tags,is_featured,featured_rank,featured_badge_text,published,created_at',
            { count: 'exact' }
        );

    if (!includeUnpublished) query = query.eq('published', true);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (q && q.trim()) {
        const pattern = `%${q.trim()}%`;
        // title OR description (description nullable)

        query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
    }

    const { data, error, count } = await query.range(from, to).order('is_featured', { ascending: false }).order('featured_rank', { ascending: true }).order('created_at', { ascending: false });

    if (error) throw error;
    const items = (data || []) as CourseListRow[];
    const total = count ?? items.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pageCount);

    const paged: PaginatedResult<CourseListRow> = {
        items,
        page: safePage,
        pageSize,
        total,
        pageCount
    };

    return paged;
}

export function useCoursesPaged(page: number, { pageSize = 12, categoryId, q, includeUnpublished = false }: UseCoursesPagedOptions = {}) {
    const query = useQuery({
        queryKey: qk.courses({ page, pageSize, categoryId, q }),
        queryFn: () => fetchCourses({ page, pageSize, categoryId, q, includeUnpublished }),
        staleTime: 30_000
    });

    return { data: query.data, isLoading: query.isLoading, error: query.error } as const;
}

export default useCoursesPaged;

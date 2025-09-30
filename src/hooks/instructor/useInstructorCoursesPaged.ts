import type { PaginatedResult } from '@main/types/pagination';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';
import { mapSupabaseError } from '@main/lib/errors';

export interface InstructorCourseRow {
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
    updated_at: string;
}

export interface UseInstructorCoursesPagedOptions {
    pageSize?: number;
    includeUnpublished?: boolean; // 기본 true (강사 관리용)
    instructorId?: string; // 명시적 instructorId (없으면 disabled)
}

interface FetchParams {
    instructorId: string;
    page: number;
    pageSize: number;
    includeUnpublished: boolean;
}

async function fetchInstructorCourses({ instructorId, page, pageSize, includeUnpublished }: FetchParams) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
        .from('courses')
        .select(
            'id,title,description,instructor_id,pricing_mode,price_cents,sale_price_cents,sale_ends_at,tax_included,currency,level,category_id,thumbnail_url,summary,tags,is_featured,featured_rank,featured_badge_text,published,created_at,updated_at',
            { count: 'exact' }
        )
        .eq('instructor_id', instructorId);

    if (!includeUnpublished) query = query.eq('published', true);

    try {
        const { data, error, count } = await query.range(from, to).order('is_featured', { ascending: false }).order('featured_rank', { ascending: true }).order('created_at', { ascending: false });

        if (error) throw error;

        const items = (data || []) as InstructorCourseRow[];
        const total = count ?? items.length;
        const pageCount = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(page, pageCount);
        const paged: PaginatedResult<InstructorCourseRow> = { items, page: safePage, pageSize, total, pageCount };

        return paged;
    } catch (e) {
        throw mapSupabaseError(e);
    }
}

export function useInstructorCoursesPaged(page: number, { pageSize = 20, includeUnpublished = true, instructorId }: UseInstructorCoursesPagedOptions = {}) {
    const enabled = !!instructorId;
    const query = useQuery({
        queryKey: instructorId ? qk.instructorCourses({ instructorId, page, pageSize, includeUnpublished }) : ['instructorCourses', 'disabled'],
        queryFn: () => fetchInstructorCourses({ instructorId: instructorId!, page, pageSize, includeUnpublished }),
        enabled
    });
    const empty: PaginatedResult<InstructorCourseRow> = { items: [], page: 1, pageSize, total: 0, pageCount: 1 };

    return { data: query.data ?? (enabled ? undefined : empty), isLoading: query.isLoading, error: query.error } as const;
}

export default useInstructorCoursesPaged;

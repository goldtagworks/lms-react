import type { PaginatedResult } from '@main/types/pagination';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';
import { mapSupabaseError } from '@main/lib/errors';

export interface InstructorPublicCourseRow {
    id: string;
    title: string;
    description: string | null;
    instructor_id: string;
    thumbnail_url: string | null;
    summary: string | null;
    tags: string[] | null;
    is_featured: boolean;
    featured_rank: number | null;
    featured_badge_text: string | null;
    published: boolean;
    created_at: string;
}

export interface UseInstructorPublicCoursesPagedOptions {
    pageSize?: number;
}

interface FetchParams {
    instructorId: string;
    page: number;
    pageSize: number;
}

async function fetchInstructorPublicCourses({ instructorId, page, pageSize }: FetchParams) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
        .from('courses')
        .select('id,title,description,instructor_id,thumbnail_url,summary,tags,is_featured,featured_rank,featured_badge_text,published,created_at', { count: 'exact' })
        .eq('instructor_id', instructorId)
        .eq('published', true);

    try {
        const { data, error, count } = await query.range(from, to).order('is_featured', { ascending: false }).order('featured_rank', { ascending: true }).order('created_at', { ascending: false });

        if (error) throw error;

        const items = (data || []) as InstructorPublicCourseRow[];
        const total = count ?? items.length;
        const pageCount = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(page, pageCount);
        const paged: PaginatedResult<InstructorPublicCourseRow> = {
            items,
            page: safePage,
            pageSize,
            total,
            pageCount
        };

        return paged;
    } catch (e) {
        throw mapSupabaseError(e);
    }
}

export function useInstructorPublicCoursesPaged(instructorId: string | undefined, page: number, { pageSize = 12 }: UseInstructorPublicCoursesPagedOptions = {}) {
    const enabled = !!instructorId;
    const query = useQuery({
        queryKey: instructorId ? qk.instructorPublicCourses({ instructorId, page, pageSize }) : ['instructorPublicCourses', 'disabled'],
        queryFn: () => fetchInstructorPublicCourses({ instructorId: instructorId!, page, pageSize }),
        enabled
    });

    const empty: PaginatedResult<InstructorPublicCourseRow> = { items: [], page: 1, pageSize, total: 0, pageCount: 1 };

    return { data: query.data ?? (enabled ? undefined : empty), isLoading: query.isLoading, error: query.error } as const;
}

export default useInstructorPublicCoursesPaged;

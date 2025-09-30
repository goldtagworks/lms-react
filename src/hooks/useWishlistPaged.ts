import type { PaginatedResult } from '@main/types/pagination';
import type { Course } from '@main/types/course';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';

async function fetchWishlistCourses(userId: string | undefined): Promise<Course[]> {
    if (!userId) return [];
    // wishlists rows
    const { data: wlRows, error: wlErr } = await supabase.from('wishlists').select('course_id').eq('user_id', userId);

    if (wlErr) throw wlErr;
    if (!wlRows || wlRows.length === 0) return [];
    const ids = Array.from(new Set(wlRows.map((r) => r.course_id)));

    if (ids.length === 0) return [];
    const { data: coursesRows, error: cErr } = await supabase
        .from('courses')
        .select(
            'id,instructor_id,title,summary,description,slug,category,tags,thumbnail_url,pricing_mode,list_price_cents,sale_price_cents,sale_ends_at,currency_code,price_cents,tax_included,tax_rate_percent,tax_country_code,progress_required_percent,is_active,published,is_featured,featured_rank,featured_badge_text,created_at,updated_at'
        )
        .in('id', ids);

    if (cErr) throw cErr;
    // wishlist 순서 유지 (현재 wishlists 순서 불명 → 입력 순/PK 순 가정)
    const map = new Map<string, Course>((coursesRows || []).map((c: any) => [c.id, c]));

    return wlRows.map((r) => map.get(r.course_id)).filter((c): c is Course => !!c);
}

interface UseWishlistPagedOptions {
    pageSize?: number;
}

export function useWishlistPaged(userId: string | undefined, page: number, { pageSize = 12 }: UseWishlistPagedOptions = {}) {
    const {
        data: wished = [],
        isLoading,
        error
    } = useQuery<Course[]>({
        queryKey: ['wishlist', userId],
        queryFn: () => fetchWishlistCourses(userId),
        enabled: !!userId
    });
    const total = wished.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items: Course[] = wished.slice(start, start + pageSize);

    const data: PaginatedResult<Course> = { items, page: safePage, pageSize, total, pageCount };

    return { data, isLoading, error } as const;
}

export default useWishlistPaged;

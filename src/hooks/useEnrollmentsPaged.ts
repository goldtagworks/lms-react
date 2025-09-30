import type { PaginatedResult } from '@main/types/pagination';
import type { Course } from '@main/types/course';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';

// TODO: 서버 enrollments + courses 조인 뷰/쿼리 확정 전 임시 단순 2-step fetch.
// NOTE: 가격/세금 필드 재계산 금지(서버 authoritative). 여기서는 조인/머지 최소화.
async function fetchEnrollmentsWithCourses(userId: string | undefined): Promise<Course[]> {
    if (!userId) return [];
    const { data: enrRows, error: enrErr } = await supabase.from('enrollments').select('id, course_id').eq('user_id', userId).eq('status', 'ENROLLED');

    if (enrErr) throw enrErr;
    if (!enrRows || enrRows.length === 0) return [];
    const courseIds = Array.from(new Set(enrRows.map((r) => r.course_id)));

    if (courseIds.length === 0) return [];

    const { data: coursesRows, error: cErr } = await supabase
        .from('courses')
        .select(
            'id,instructor_id,title,summary,description,slug,category,tags,thumbnail_url,pricing_mode,list_price_cents,sale_price_cents,sale_ends_at,currency_code,price_cents,tax_included,tax_rate_percent,tax_country_code,progress_required_percent,is_active,published,is_featured,featured_rank,featured_badge_text,created_at,updated_at'
        )
        .in('id', courseIds);

    if (cErr) throw cErr;
    const map = new Map<string, Course>((coursesRows || []).map((c: any) => [c.id, c]));
    const merged = enrRows.map((e) => map.get(e.course_id)).filter((c): c is Course => !!c);

    return merged as Course[];
}

interface UseEnrollmentsPagedOptions {
    pageSize?: number;
}

export function useEnrollmentsPaged(userId: string | undefined, page: number, { pageSize = 8 }: UseEnrollmentsPagedOptions = {}) {
    const {
        data: list = [],
        isLoading,
        error
    } = useQuery<Course[]>({
        queryKey: ['enrollments', userId],
        queryFn: () => fetchEnrollmentsWithCourses(userId),
        enabled: !!userId
    });

    const total = list.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items: Course[] = list.slice(start, start + pageSize);

    const data: PaginatedResult<Course> = { items, page: safePage, pageSize, total, pageCount };

    return { data, isLoading, error } as const;
}

export default useEnrollmentsPaged;

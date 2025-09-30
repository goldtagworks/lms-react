import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

export interface CourseRow {
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

async function fetchCourse(id: string | undefined): Promise<CourseRow | null> {
    if (!id) return null;
    const { data, error } = await supabase
        .from('courses')
        .select(
            'id,title,description,instructor_id,pricing_mode,price_cents,sale_price_cents,sale_ends_at,tax_included,currency,level,category_id,thumbnail_url,summary,tags,is_featured,featured_rank,featured_badge_text,published,created_at,updated_at'
        )
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;

    return (data as CourseRow) || null;
}

export function useCourseQuery(id: string | undefined) {
    const query = useQuery({
        queryKey: qk.course(id || 'unknown'),
        queryFn: () => fetchCourse(id),
        enabled: !!id,
        staleTime: 60_000
    });

    return { data: query.data, isLoading: query.isLoading, error: query.error } as const;
}

export default useCourseQuery;

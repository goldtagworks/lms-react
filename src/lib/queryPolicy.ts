// Query 정책 & 공통 상수

export const COURSE_FIELDS_LIST =
    'id,title,description,instructor_id,pricing_mode,price_cents,sale_price_cents,sale_ends_at,tax_included,currency,level,category_id,thumbnail_url,summary,tags,is_featured,featured_rank,featured_badge_text,published,created_at';
export const COURSE_FIELDS_INSTRUCTOR = COURSE_FIELDS_LIST + ',updated_at';

// 추천 정렬 체인 (우선순위: 추천여부 -> featured_rank -> 최신)
export const FEATURED_ORDER = [
    { column: 'is_featured', ascending: false },
    { column: 'featured_rank', ascending: true },
    { column: 'created_at', ascending: false }
];

export interface QueryResourcePolicy {
    staleTime: number;
}

export const queryPolicy: Record<string, QueryResourcePolicy> = {
    courses: { staleTime: 30_000 },
    instructorCourses: { staleTime: 15_000 },
    instructorPublicCourses: { staleTime: 30_000 },
    notices: { staleTime: 60_000 },
    instructorApps: { staleTime: 15_000 },
    reviews: { staleTime: 20_000 },
    qna: { staleTime: 20_000 }
};

export function applyFeaturedOrder<T extends { order: Function }>(query: T) {
    FEATURED_ORDER.forEach((o) => {
        // @ts-ignore - supabase query builder order 체인
        query = query.order(o.column, { ascending: o.ascending });
    });

    return query;
}

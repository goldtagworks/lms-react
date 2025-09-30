import type { PaginatedResult } from '@main/types/pagination';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

export type InstructorAppBucket = 'PENDING' | 'DECIDED' | 'REVOKED';

export interface InstructorApplicationRow {
    id: string;
    user_id: string;
    display_name: string;
    bio_md: string | null;
    links: any | null; // [{label,url}]
    status: string;
    created_at: string;
    decided_at: string | null;
    rejection_reason: string | null;
    revoked_at: string | null;
    revoke_reason: string | null;
}

interface UseInstructorAppsPagedOptions {
    pageSize?: number;
    search?: string;
}

interface FetchParams {
    bucket: InstructorAppBucket;
    page: number;
    pageSize: number;
    search: string;
}

// Supabase query builder 타입 구체화보다는 any 로 단순 처리 (추후 generated types 도입 시 교체 가능)
function applyBucketFilter(query: any, bucket: InstructorAppBucket) {
    switch (bucket) {
        case 'PENDING':
            return query.eq('status', 'PENDING');
        case 'DECIDED':
            return query.in('status', ['APPROVED', 'REJECTED']);
        case 'REVOKED':
            return query.eq('status', 'REVOKED');
    }
}

async function fetchInstructorApps({ bucket, page, pageSize, search }: FetchParams) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
        .from('instructor_applications')
        .select('id,user_id,display_name,bio_md,links,status,created_at,decided_at,rejection_reason,revoked_at,revoke_reason', { count: 'exact' })
        .order('created_at', { ascending: false });

    query = applyBucketFilter(query, bucket);

    if (search.trim()) {
        const lowered = search.trim().toLowerCase();
        // display_name ILIKE OR user_id ILIKE
        const pattern = `%${lowered}%`;

        query = query.or(`display_name.ilike.${pattern},user_id.ilike.${pattern}`);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;
    const items = (data || []) as InstructorApplicationRow[];
    const total = count ?? items.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pageCount);
    const paged: PaginatedResult<InstructorApplicationRow> = { items, page: safePage, pageSize, total, pageCount };

    return paged;
}

export function useInstructorAppsPaged(bucket: InstructorAppBucket, page: number, { pageSize = 10, search = '' }: UseInstructorAppsPagedOptions = {}) {
    const query = useQuery({
        queryKey: qk.instructorApps({ bucket, page, pageSize, search }),
        queryFn: () => fetchInstructorApps({ bucket, page, pageSize, search }),
        staleTime: 30_000
    });

    return { data: query.data, isLoading: query.isLoading, error: query.error } as const;
}

export default useInstructorAppsPaged;

import type { PaginatedResult } from '@main/types/pagination';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

export interface NoticeRow {
    id: string;
    title: string;
    body: string | null;
    pinned: boolean;
    published: boolean;
    created_at: string;
    updated_at: string;
}

interface UseNoticesPagedOptions {
    pageSize?: number;
    includePinnedFirst?: boolean; // pinned 우선 정렬 (기본 true)
    includeUnpublished?: boolean; // 관리자 모드에서 초안 포함
}

interface FetchParams {
    page: number;
    pageSize: number;
    includePinnedFirst: boolean;
    includeUnpublished: boolean;
}

async function fetchNotices({ page, pageSize, includePinnedFirst, includeUnpublished }: FetchParams) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase.from('notices').select('id,title,body,pinned,published,created_at,updated_at', { count: 'exact' });

    if (!includeUnpublished) query = query.eq('published', true);

    if (includePinnedFirst) {
        query = query.order('pinned', { ascending: false }).order('created_at', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;
    const items = (data || []) as NoticeRow[];
    const total = count ?? items.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pageCount);
    const paged: PaginatedResult<NoticeRow> = { items, page: safePage, pageSize, total, pageCount };

    return paged;
}

export function useNoticesPaged(page: number, { pageSize = 15, includePinnedFirst = true, includeUnpublished = false }: UseNoticesPagedOptions = {}) {
    const query = useQuery({
        queryKey: qk.notices({ page, pageSize, includePinnedFirst }),
        queryFn: () => fetchNotices({ page, pageSize, includePinnedFirst, includeUnpublished }),
        staleTime: 30_000
    });

    return { data: query.data, isLoading: query.isLoading, error: query.error } as const;
}

export default useNoticesPaged;

import type { PaginatedResult } from '@main/types/pagination';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

export interface UseAdminCategoriesPagedOptions {
    pageSize?: number;
    q?: string;
}

interface CategoryRow {
    id: string;
    slug: string;
    name: string;
}

async function fetchAll(): Promise<CategoryRow[]> {
    const { data, error } = await supabase.from('categories').select('id,slug,name').order('name', { ascending: true });

    if (error) throw error;

    return (data as CategoryRow[]) || [];
}

export function useAdminCategoriesPaged(page: number, { pageSize = 50, q }: UseAdminCategoriesPagedOptions = {}) {
    const query = useQuery({ queryKey: qk.categories(), queryFn: fetchAll, staleTime: 60_000 });
    const list = query.data || [];

    const filtered = useMemo(() => {
        if (!q || !q.trim()) return list;
        const qq = q.trim().toLowerCase();

        return list.filter((c) => c.name.toLowerCase().includes(qq) || c.slug.toLowerCase().includes(qq));
    }, [list, q]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safe = Math.min(page, totalPages);
    const slice = filtered.slice((safe - 1) * pageSize, safe * pageSize);
    const data: PaginatedResult<CategoryRow> = { items: slice, page: safe, pageSize, total, pageCount: totalPages };

    function refresh() {
        query.refetch();
    }

    return { data, refresh, isLoading: query.isLoading, error: query.error } as const;
}

export default useAdminCategoriesPaged;

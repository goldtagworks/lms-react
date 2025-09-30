import type { PaginatedResult } from '@main/types/pagination';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

export interface UseAdminUsersPagedOptions {
    pageSize?: number;
    q?: string; // 이름/이메일 부분 검색
}

interface UserRow {
    user_id: string;
    name: string | null;
    email: string | null; // profiles에 email 없다면 view 필요 (가정)
}

async function fetchUsers(): Promise<UserRow[]> {
    // NOTE: email 컬럼이 profiles에 없을 경우: 서버 측 view v_admin_users 필요.
    const { data, error } = await supabase.from('profiles').select('user_id,name,email').limit(1000);

    if (error) throw error;

    return (data as any as UserRow[]) || [];
}

export function useAdminUsersPaged(page: number, { pageSize = 20, q }: UseAdminUsersPagedOptions = {}) {
    const query = useQuery({ queryKey: qk.adminUsers({ q: q || '', page, pageSize }), queryFn: fetchUsers, staleTime: 60_000 });
    const list = query.data || [];

    const filtered = useMemo(() => {
        if (!q || !q.trim()) return list;
        const qq = q.trim().toLowerCase();

        return list.filter((u) => (u.name || '').toLowerCase().includes(qq) || (u.email || '').toLowerCase().includes(qq));
    }, [list, q]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safe = Math.min(page, totalPages);
    const slice = filtered.slice((safe - 1) * pageSize, safe * pageSize);
    const data: PaginatedResult<UserRow> = { items: slice, page: safe, pageSize, total, pageCount: totalPages };

    function refresh() {
        query.refetch();
    }

    return { data, refresh, isLoading: query.isLoading, error: query.error } as const;
}

export default useAdminUsersPaged;

import type { PaginatedResult } from '@main/types/pagination';

import { useEffect, useMemo, useState } from 'react';
import { listUsers } from '@main/lib/repository';
import { paginateArray } from '@main/lib/paginate';

export interface UseAdminUsersPagedOptions {
    pageSize?: number;
    q?: string; // 간단 이메일/이름 검색 (mock)
}

export function useAdminUsersPaged(page: number, { pageSize = 20, q }: UseAdminUsersPagedOptions = {}) {
    const [revision, setRevision] = useState(0);
    const [raw, setRaw] = useState(() => listUsers());

    useEffect(() => {
        setRaw(listUsers());
    }, [revision]);

    const filtered = useMemo(() => {
        if (!q) return raw;
        const query = q.toLowerCase();

        return raw.filter((u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query));
    }, [raw, q]);

    const data: PaginatedResult<any> = useMemo(() => paginateArray(filtered, page, pageSize), [filtered, page, pageSize]);

    function refresh() {
        setRevision((r) => r + 1);
    }

    return { data, refresh } as const;
}

export default useAdminUsersPaged;

import type { PaginatedResult } from '@main/types/pagination';

import { useEffect, useMemo, useState } from 'react';
import { listCategories } from '@main/lib/repository';
import { paginateArray } from '@main/lib/paginate';

export interface UseAdminCategoriesPagedOptions {
    pageSize?: number;
    q?: string; // 검색 (이름 / slug)
    active?: 'all' | 'active' | 'inactive';
    sort?: 'order' | 'name';
}

export function useAdminCategoriesPaged(page: number, { pageSize = 50, q, active = 'all', sort = 'order' }: UseAdminCategoriesPagedOptions = {}) {
    const [raw, setRaw] = useState(() => listCategories());
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        setRaw(listCategories());
    }, [revision]);
    const filtered = useMemo(() => {
        let arr = raw;

        if (active !== 'all') arr = arr.filter((c) => (active === 'active' ? c.active : !c.active));

        if (q && q.trim()) {
            const qq = q.trim().toLowerCase();

            arr = arr.filter((c) => c.name.toLowerCase().includes(qq) || c.slug.toLowerCase().includes(qq));
        }

        if (sort === 'name') arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
        else arr = [...arr].sort((a, b) => a.sort_order - b.sort_order);

        return arr;
    }, [raw, q, active, sort]);

    const data: PaginatedResult<any> = useMemo(() => paginateArray(filtered, page, pageSize), [filtered, page, pageSize]);

    function refresh() {
        setRevision((r) => r + 1);
    }

    return { data, refresh } as const;
}

export default useAdminCategoriesPaged;

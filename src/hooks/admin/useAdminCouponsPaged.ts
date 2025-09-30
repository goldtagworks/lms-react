import type { PaginatedResult } from '@main/types/pagination';

import { useEffect, useMemo, useState } from 'react';
import { listCouponsPaged } from '@main/lib/repository';

export interface UseAdminCouponsPagedOptions {
    pageSize?: number;
    q?: string;
    active?: 'all' | 'active' | 'inactive';
}

export function useAdminCouponsPaged(page: number, { pageSize = 20, q, active = 'all' }: UseAdminCouponsPagedOptions = {}) {
    const [revision, setRevision] = useState(0);
    const [raw, setRaw] = useState(() => listCouponsPaged({ q: q?.trim() || undefined, active: active === 'all' ? undefined : active === 'active' }, page, pageSize));

    useEffect(() => {
        const res = listCouponsPaged({ q: q?.trim() || undefined, active: active === 'all' ? undefined : active === 'active' }, page, pageSize);

        setRaw(res);
    }, [q, active, page, pageSize, revision]);

    const data: PaginatedResult<any> = useMemo(() => ({ items: raw.items, page: raw.page, pageSize, total: raw.total, pageCount: raw.totalPages }), [raw, pageSize]);

    function refresh() {
        setRevision((r) => r + 1);
    }

    return { data, refresh } as const;
}

export default useAdminCouponsPaged;

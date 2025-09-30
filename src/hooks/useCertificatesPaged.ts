import type { PaginatedResult } from '@main/types/pagination';

import { useEffect, useMemo, useState } from 'react';
import { useCertificates } from '@main/lib/repository';

export interface UseCertificatesPagedOptions {
    pageSize?: number;
    userId?: string;
}

export function useCertificatesPaged(page: number, { pageSize = 20, userId }: UseCertificatesPagedOptions = {}) {
    const raw = useCertificates(userId);
    const [localPage, setLocalPage] = useState(page);

    useEffect(() => {
        setLocalPage(page);
    }, [page]);

    const total = raw.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, localPage), pageCount);
    const start = (safePage - 1) * pageSize;
    const items = raw.slice(start, start + pageSize);

    const data: PaginatedResult<any> = useMemo(() => ({ items, page: safePage, pageSize, total, pageCount }), [items, safePage, pageSize, total, pageCount]);

    return { data } as const;
}

export default useCertificatesPaged;

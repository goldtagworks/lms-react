import type { PaginatedResult } from '@main/types/pagination';
import type { Notice } from '@main/types/notice';

import { useMemo } from 'react';
import { useNotices } from '@main/lib/noticeRepo';

interface UseNoticesPagedOptions {
    pageSize?: number;
    includePinnedFirst?: boolean;
}

export function useNoticesPaged(page: number, { pageSize = 15, includePinnedFirst = true }: UseNoticesPagedOptions = {}) {
    const notices = useNotices();

    const ordered = useMemo(() => {
        const base = [...notices];

        if (!includePinnedFirst) return base;

        return base.sort((a, b) => {
            const ap = a.pinned ? 1 : 0;
            const bp = b.pinned ? 1 : 0;

            if (ap !== bp) return bp - ap; // pinned 먼저
            // 최신순 (created_at DESC)

            return a.created_at < b.created_at ? 1 : -1;
        });
    }, [notices, includePinnedFirst]);

    const total = ordered.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items: Notice[] = ordered.slice(start, start + pageSize);

    const data: PaginatedResult<Notice> = { items, page: safePage, pageSize, total, pageCount };

    return { data } as const;
}

export default useNoticesPaged;

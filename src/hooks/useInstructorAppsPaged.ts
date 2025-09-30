import type { PaginatedResult } from '@main/types/pagination';
import type { InstructorApplication } from '@main/lib/repository';

import { useMemo } from 'react';
import { useInstructorApplications } from '@main/lib/repository';

export type InstructorAppBucket = 'PENDING' | 'DECIDED' | 'REVOKED';

interface UseInstructorAppsPagedOptions {
    pageSize?: number;
    search?: string;
}

export function useInstructorAppsPaged(bucket: InstructorAppBucket, page: number, { pageSize = 10, search = '' }: UseInstructorAppsPagedOptions = {}) {
    const apps = useInstructorApplications();

    const filtered = useMemo(() => {
        const lowered = search.trim().toLowerCase();

        return apps.filter((a) => {
            // bucket filter
            switch (bucket) {
                case 'PENDING':
                    if (a.status !== 'PENDING') return false;
                    break;
                case 'DECIDED':
                    if (a.status === 'PENDING' || a.status === 'REVOKED') return false; // APPROVED | REJECTED
                    break;
                case 'REVOKED':
                    if (a.status !== 'REVOKED') return false;
                    break;
            }
            if (!lowered) return true;

            return a.display_name.toLowerCase().includes(lowered) || a.user_id.toLowerCase().includes(lowered);
        });
    }, [apps, bucket, search]);

    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize) as InstructorApplication[];

    const data: PaginatedResult<InstructorApplication> = { items, page: safePage, pageSize, total, pageCount };

    return { data } as const;
}

export default useInstructorAppsPaged;

import type { PaginatedResult } from '@main/types/pagination';
import type { Course } from '@main/types/course';

import { useMemo } from 'react';
import { useCourses, useWishlistState, isWishlisted } from '@main/lib/repository';

interface UseWishlistPagedOptions {
    pageSize?: number;
}

export function useWishlistPaged(userId: string | undefined, page: number, { pageSize = 12 }: UseWishlistPagedOptions = {}) {
    const allCourses = useCourses();

    useWishlistState(userId); // 구독 위해 호출 (반환값 직접 안 써도 변화 트리거)

    const wished = useMemo(() => (userId ? allCourses.filter((c) => isWishlisted(userId, c.id)) : []), [allCourses, userId]);
    const total = wished.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items: Course[] = wished.slice(start, start + pageSize);

    const data: PaginatedResult<Course> = { items, page: safePage, pageSize, total, pageCount };

    return { data } as const;
}

export default useWishlistPaged;

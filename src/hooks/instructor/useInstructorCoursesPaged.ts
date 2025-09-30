import type { PaginatedResult } from '@main/types/pagination';

import { useEffect, useState, useMemo } from 'react';
import { loadCoursesPaged } from '@main/lib/repository';

// 간단: 추후 instructor_id 필터/정렬 추가 예정
export interface UseInstructorCoursesPagedOptions {
    pageSize?: number;
}

export function useInstructorCoursesPaged(page: number, { pageSize = 20 }: UseInstructorCoursesPagedOptions = {}) {
    const [revision, setRevision] = useState(0);
    const [raw, setRaw] = useState(() => loadCoursesPaged(page, pageSize));

    useEffect(() => {
        const res = loadCoursesPaged(page, pageSize);

        setRaw(res);
    }, [page, pageSize, revision]);

    const data: PaginatedResult<any> = useMemo(
        () => ({
            items: raw.items,
            page: raw.page,
            pageSize: raw.pageSize,
            total: raw.total,
            pageCount: raw.totalPages
        }),
        [raw]
    );

    function refresh() {
        setRevision((r) => r + 1);
    }

    return { data, refresh } as const;
}

export default useInstructorCoursesPaged;

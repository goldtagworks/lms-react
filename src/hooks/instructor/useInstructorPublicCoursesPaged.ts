import type { PaginatedResult } from '@main/types/pagination';

import { useMemo } from 'react';
import { useCourses } from '@main/lib/repository';
import { paginateArray } from '@main/lib/paginate';

export interface UseInstructorPublicCoursesPagedOptions {
    pageSize?: number;
}

export function useInstructorPublicCoursesPaged(instructorId: string | undefined, page: number, { pageSize = 12 }: UseInstructorPublicCoursesPagedOptions = {}) {
    const all = useCourses();
    const filtered = useMemo(() => (instructorId ? all.filter((c) => c.instructor_id === instructorId && c.published && c.is_active) : []) as any[], [all, instructorId]);
    const data: PaginatedResult<any> = useMemo(() => paginateArray(filtered, page, pageSize), [filtered, page, pageSize]);

    return { data } as const;
}

export default useInstructorPublicCoursesPaged;

import type { PaginatedResult } from '@main/types/pagination';
import type { Course } from '@main/types/course';

import { useMemo } from 'react';
import { useEnrollmentsState, useCourses } from '@main/lib/repository';

interface UseEnrollmentsPagedOptions {
    pageSize?: number;
}

export function useEnrollmentsPaged(userId: string | undefined, page: number, { pageSize = 8 }: UseEnrollmentsPagedOptions = {}) {
    const enrollments = useEnrollmentsState(userId);
    const courses = useCourses();

    const list = useMemo(() => enrollments.map((e) => courses.find((c) => c.id === e.course_id)).filter((c): c is Course => !!c), [enrollments, courses]);
    const total = list.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items: Course[] = list.slice(start, start + pageSize);

    const data: PaginatedResult<Course> = { items, page: safePage, pageSize, total, pageCount };

    return { data } as const;
}

export default useEnrollmentsPaged;

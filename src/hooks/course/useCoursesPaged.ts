import type { PaginatedResult } from '@main/types/pagination';
import type { Course } from '@main/types/course';

import { useMemo } from 'react';
import { useCourses } from '@main/lib/repository';

interface UseCoursesPagedOptions {
    pageSize?: number;
    category?: string;
    query?: string;
}

export function useCoursesPaged(page: number, { pageSize = 12, category = 'all', query = '' }: UseCoursesPagedOptions = {}) {
    const courses = useCourses();

    const filtered = useMemo(() => {
        const base = courses.filter((c) => {
            if (category !== 'all' && c.category !== category) return false;
            if (query.trim()) {
                const q = query.trim().toLowerCase();
                const inTitle = c.title.toLowerCase().includes(q);
                const inSummary = (c.summary || '').toLowerCase().includes(q);
                const inTags = (c.tags || []).some((t) => t.toLowerCase().includes(q));

                if (!inTitle && !inSummary && !inTags) return false;
            }

            return true;
        });

        return base.slice().sort((a, b) => {
            const af = a.is_featured ? 1 : 0;
            const bf = b.is_featured ? 1 : 0;

            if (af !== bf) return bf - af;
            if (a.is_featured && b.is_featured) {
                const ar = a.featured_rank ?? 999;
                const br = b.featured_rank ?? 999;

                if (ar !== br) return ar - br;
            }

            return 0;
        });
    }, [courses, category, query]);

    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items: Course[] = filtered.slice(start, start + pageSize);

    const data: PaginatedResult<Course> = { items, page: safePage, pageSize, total, pageCount };

    return { data } as const;
}

export default useCoursesPaged;

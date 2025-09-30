import type { PaginatedResult } from '@main/types/pagination';
import type { CourseQuestion } from '@main/types/qna';

import { useMemo } from 'react';
import { useCourseQuestionsState } from '@main/lib/repository';

interface UseCourseQnAPagedOptions {
    pageSize?: number;
    viewerId?: string;
}

// 표준 페이지네이션 훅: PaginatedResult 반환
export function useCourseQnAPaged(courseId: string | undefined, page: number, { pageSize = 10, viewerId }: UseCourseQnAPagedOptions = {}) {
    const raw = useCourseQuestionsState(courseId);

    const filtered = useMemo(() => raw.filter((q: any) => !q.is_private || q.user_id === viewerId), [raw, viewerId]);
    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items: CourseQuestion[] = filtered.slice(start, start + pageSize);

    const data: PaginatedResult<CourseQuestion> = { items, page: safePage, pageSize, total, pageCount };

    return { data } as const;
}

export default useCourseQnAPaged;

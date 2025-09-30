import type { PaginatedResult } from '@main/types/pagination';
import type { CourseQuestion } from '@main/types/qna';

import { useQuery } from '@tanstack/react-query';
import { qk } from '@main/lib/queryKeys';
import { supabase } from '@main/lib/supabase';
import { mapSupabaseError } from '@main/lib/errors';
import { computeRange, buildPagedResult, emptyPage } from '@main/lib/paging';

interface UseCourseQnAPagedOptions {
    pageSize?: number;
    viewerId?: string; // 현재 스키마에 비공개 필드 없음 -> 미래 확장 예약
}

export function useCourseQnAPaged(courseId: string | undefined, page: number, { pageSize = 10 }: UseCourseQnAPagedOptions = {}) {
    const enabled = !!courseId;

    return useQuery({
        queryKey: courseId ? qk.qna({ courseId, page, pageSize }) : ['qna', 'disabled'],
        enabled,
        queryFn: async (): Promise<PaginatedResult<CourseQuestion>> => {
            const { from, to } = computeRange(page, pageSize);

            try {
                const { data, error, count } = await supabase
                    .from('course_questions')
                    .select('*', { count: 'exact' })
                    .eq('course_id', courseId!)
                    .order('created_at', { ascending: false })
                    .range(from, to);

                if (error) throw error;

                return buildPagedResult({ items: (data || []) as CourseQuestion[], count, page, pageSize });
            } catch (e) {
                throw mapSupabaseError(e);
            }
        },
        placeholderData: !enabled ? emptyPage<CourseQuestion>(pageSize) : undefined
    });
}

export default useCourseQnAPaged;

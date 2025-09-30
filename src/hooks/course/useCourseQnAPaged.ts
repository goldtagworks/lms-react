import type { PaginatedResult } from '@main/types/pagination';
import type { CourseQuestion } from '@main/types/qna';

import { useQuery } from '@tanstack/react-query';
import { qk } from '@main/lib/queryKeys';
import { supabase } from '@main/lib/supabase';

interface UseCourseQnAPagedOptions {
    pageSize?: number;
    viewerId?: string; // 현재 스키마에 비공개 필드 없음 -> 미래 확장 예약
}

export function useCourseQnAPaged(courseId: string | undefined, page: number, { pageSize = 10 }: UseCourseQnAPagedOptions = {}) {
    return useQuery({
        queryKey: courseId ? qk.qna({ courseId, page, pageSize }) : ['qna', 'disabled'],
        enabled: !!courseId,
        queryFn: async (): Promise<PaginatedResult<CourseQuestion>> => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            const { data, error, count } = await supabase.from('course_questions').select('*', { count: 'exact' }).eq('course_id', courseId!).order('created_at', { ascending: false }).range(from, to);

            if (error) throw error;
            const total = count ?? 0;
            const pageCount = Math.max(1, Math.ceil(total / pageSize));

            return { items: data as CourseQuestion[], page, pageSize, total, pageCount };
        }
    });
}

export default useCourseQnAPaged;

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

export interface ExamAttemptRow {
    id: string;
    exam_id: string;
    enrollment_id: string;
    started_at: string;
    submitted_at: string | null;
    score: number | null;
    passed: boolean | null;
    answers: any | null;
    created_at: string;
}

async function fetchAttempts(params: { examId?: string; enrollmentId?: string }) {
    let query = supabase.from('exam_attempts').select('*');

    if (params.examId) query = query.eq('exam_id', params.examId);
    if (params.enrollmentId) query = query.eq('enrollment_id', params.enrollmentId);
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as ExamAttemptRow[];
}

export function useExamAttempts(filter: { examId?: string; enrollmentId?: string }) {
    return useQuery<ExamAttemptRow[]>({
        queryKey: qk.examAttempts(filter),
        queryFn: () => fetchAttempts(filter),
        enabled: !!(filter.examId || filter.enrollmentId)
    });
}

export interface UseExamAttemptsPagedOptions {
    pageSize?: number;
    examId?: string;
    enrollmentId?: string;
}

export function useExamAttemptsPaged(page: number, { pageSize = 20, examId, enrollmentId }: UseExamAttemptsPagedOptions) {
    const query = useExamAttempts({ examId, enrollmentId });
    const list = query.data || [];
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = list.slice(start, start + pageSize);

    return { ...query, data: { items, page: safePage, pageSize, total, pageCount: totalPages } } as const;
}

export default useExamAttempts;

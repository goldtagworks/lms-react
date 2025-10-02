import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

export interface ExamRow {
    id: string;
    course_id: string;
    title: string;
    pass_score: number;
    created_at: string;
    updated_at: string;
}

async function fetchExam(id: string | undefined): Promise<ExamRow | null> {
    if (!id) return null;
    const { data, error } = await supabase.from('exams').select('*').eq('id', id).maybeSingle();

    if (error) throw error;

    return (data as ExamRow) || null;
}

export function useExam(id: string | undefined) {
    return useQuery<ExamRow | null>({
        queryKey: qk.exam(id || 'unknown'),
        queryFn: () => fetchExam(id),
        enabled: !!id
    });
}

export default useExam;

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@main/lib/supabase';
import { qk } from '@main/lib/queryKeys';

export interface ExamQuestionRow {
    id: string;
    exam_id: string;
    type: 'single' | 'multiple' | 'short';
    stem: string;
    choices?: any;
    answer: any;
    created_at: string;
    updated_at: string;
}

async function fetchExamQuestions(examId: string | undefined): Promise<ExamQuestionRow[]> {
    if (!examId) return [];
    const { data, error } = await supabase.from('exam_questions').select('*').eq('exam_id', examId).order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []) as ExamQuestionRow[];
}

export function useExamQuestions(examId: string | undefined) {
    return useQuery<ExamQuestionRow[]>({
        queryKey: qk.examQuestions(examId || 'unknown'),
        queryFn: () => fetchExamQuestions(examId),
        enabled: !!examId
    });
}

export default useExamQuestions;

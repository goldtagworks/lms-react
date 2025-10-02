import { supabase } from '@main/lib/supabase';

export interface SubmitExamRequest {
    examId: string;
    answers: Record<string, any>;
    userId: string;
    enrollmentId: string;
}

export interface ExamGradeResult {
    attemptId: string;
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    passScore: number;
}

/**
 * 시험 제출 및 채점 처리
 */
export async function submitExamForGrading(request: SubmitExamRequest): Promise<ExamGradeResult> {
    try {
        const { data, error } = await supabase.functions.invoke('grade-exam', {
            body: request
        });

        if (error) {
            throw new Error(`Grading failed: ${error.message}`);
        }

        return data as ExamGradeResult;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('시험 제출 오류:', error);
        throw error;
    }
}

/**
 * 시험 결과 조회
 */
export async function getExamResult(attemptId: string): Promise<ExamGradeResult | null> {
    try {
        const { data, error } = await supabase
            .from('exam_attempts')
            .select(
                `
                id,
                score,
                passed,
                answers,
                exam_id,
                exams!inner(pass_score)
            `
            )
            .eq('id', attemptId)
            .single();

        if (error || !data) {
            return null;
        }

        // 정답 수 계산을 위해 문제 수 조회
        const { data: questions } = await supabase.from('exam_questions').select('id').eq('exam_id', data.exam_id);

        const totalQuestions = questions?.length || 0;
        const correctCount = data.score ? Math.round((data.score / 100) * totalQuestions) : 0;

        return {
            attemptId: data.id,
            score: data.score || 0,
            passed: data.passed || false,
            correctCount,
            totalQuestions,
            passScore: (data.exams as any).pass_score
        };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('시험 결과 조회 오류:', error);

        return null;
    }
}

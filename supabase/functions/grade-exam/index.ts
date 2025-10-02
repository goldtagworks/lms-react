import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-timestamp'
};

interface GradeExamRequest {
    examId: string;
    answers: Record<string, any>;
    userId: string;
    enrollmentId: string;
}

interface ExamQuestion {
    id: string;
    type: 'single' | 'multiple' | 'short';
    answer: any;
}

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 환경변수에서 Supabase 클라이언트 생성
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ code: 'E_METHOD_NOT_ALLOWED', message: 'Only POST method allowed' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { examId, answers, userId, enrollmentId }: GradeExamRequest = await req.json();

        console.log(
            JSON.stringify({
                function_name: 'grade-exam',
                exam_id: examId,
                user_id: userId,
                enrollment_id: enrollmentId,
                status: 'started'
            })
        );

        // 1. 시험 정보 조회
        const { data: exam, error: examError } = await supabase.from('exams').select('id, pass_score').eq('id', examId).single();

        if (examError || !exam) {
            console.log(
                JSON.stringify({
                    function_name: 'grade-exam',
                    exam_id: examId,
                    status: 'error',
                    error_code: 'E_EXAM_NOT_FOUND'
                })
            );

            return new Response(JSON.stringify({ code: 'E_EXAM_NOT_FOUND', message: 'Exam not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 2. 시험 문제 조회
        const { data: questions, error: questionsError } = await supabase.from('exam_questions').select('id, type, answer').eq('exam_id', examId).order('created_at', { ascending: true });

        if (questionsError || !questions) {
            console.log(
                JSON.stringify({
                    function_name: 'grade-exam',
                    exam_id: examId,
                    status: 'error',
                    error_code: 'E_QUESTIONS_NOT_FOUND'
                })
            );

            return new Response(JSON.stringify({ code: 'E_QUESTIONS_NOT_FOUND', message: 'Questions not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 3. 채점 로직
        let correctCount = 0;
        const totalQuestions = questions.length;

        for (const question of questions as ExamQuestion[]) {
            const userAnswer = answers[question.id];
            const correctAnswer = question.answer;

            let isCorrect = false;

            switch (question.type) {
                case 'single':
                    isCorrect = userAnswer === correctAnswer;
                    break;

                case 'multiple':
                    // 배열 비교: 정렬 후 비교
                    if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
                        const sortedUser = [...userAnswer].sort();
                        const sortedCorrect = [...correctAnswer].sort();

                        isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
                    }
                    break;

                case 'short':
                    // 대소문자 무시하고 공백 제거 후 비교
                    if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
                        isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
                    }
                    break;
            }

            if (isCorrect) {
                correctCount++;
            }
        }

        // 4. 점수 계산
        const score = Math.round((correctCount / totalQuestions) * 100);
        const passed = score >= exam.pass_score;

        // 5. exam_attempt 레코드 생성/업데이트
        const { data: attempt, error: attemptError } = await supabase
            .from('exam_attempts')
            .upsert({
                exam_id: examId,
                enrollment_id: enrollmentId,
                started_at: new Date().toISOString(),
                submitted_at: new Date().toISOString(),
                score: score,
                passed: passed,
                answers: answers
            })
            .select('id')
            .single();

        if (attemptError) {
            console.log(
                JSON.stringify({
                    function_name: 'grade-exam',
                    exam_id: examId,
                    user_id: userId,
                    status: 'error',
                    error_code: 'E_ATTEMPT_SAVE_FAILED',
                    error: attemptError.message
                })
            );

            return new Response(JSON.stringify({ code: 'E_ATTEMPT_SAVE_FAILED', message: 'Failed to save attempt' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 6. 합격 시 수료증 발급 트리거 (TODO: certificate-issue 함수 호출)
        if (passed) {
            console.log(
                JSON.stringify({
                    function_name: 'grade-exam',
                    exam_id: examId,
                    user_id: userId,
                    enrollment_id: enrollmentId,
                    attempt_id: attempt.id,
                    status: 'passed',
                    score: score,
                    trigger: 'certificate_issue'
                })
            );

            // TODO: 수료증 발급 Edge Function 호출
            // await fetch(`${supabaseUrl}/functions/v1/issue-certificate`, {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
            //   body: JSON.stringify({ enrollmentId, examAttemptId: attempt.id, userId })
            // })
        }

        console.log(
            JSON.stringify({
                function_name: 'grade-exam',
                exam_id: examId,
                user_id: userId,
                enrollment_id: enrollmentId,
                attempt_id: attempt.id,
                status: 'completed',
                score: score,
                passed: passed,
                correct_count: correctCount,
                total_questions: totalQuestions
            })
        );

        return new Response(
            JSON.stringify({
                attemptId: attempt.id,
                score: score,
                passed: passed,
                correctCount: correctCount,
                totalQuestions: totalQuestions,
                passScore: exam.pass_score
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.log(
            JSON.stringify({
                function_name: 'grade-exam',
                status: 'error',
                error_code: 'E_INTERNAL_ERROR',
                error: error.message
            })
        );

        return new Response(JSON.stringify({ code: 'E_INTERNAL_ERROR', message: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});

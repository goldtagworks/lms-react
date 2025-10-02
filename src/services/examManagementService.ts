/* eslint-disable */
import type { ExamQuestion, CreateExamQuestionRequest, UpdateExamQuestionRequest, ExamWithQuestions, CreateExamRequest, UpdateExamRequest } from '@main/types/examManagement';

import { supabase } from '@main/lib/supabase';

/**
 * 관리자용 시험 목록 조회
 */
export async function getExamsForAdmin(): Promise<ExamWithQuestions[]> {
    try {
        const { data, error } = await supabase
            .from('exams')
            .select(
                `
                id,
                course_id,
                title,
                description_md,
                pass_score,
                time_limit_minutes,
                question_count,
                created_at,
                updated_at,
                courses!inner (
                    id,
                    title
                )
            `
            )
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((exam: any) => ({
            id: exam.id,
            courseId: exam.course_id,
            title: exam.title,
            descriptionMd: exam.description_md,
            passScore: exam.pass_score,
            timeLimitMinutes: exam.time_limit_minutes,
            questionCount: exam.question_count,
            createdAt: exam.created_at,
            updatedAt: exam.updated_at,
            questions: [], // 별도 로드
            course: {
                id: exam.courses.id,
                title: exam.courses.title
            }
        }));
    } catch (error) {
        console.error('시험 목록 조회 오류:', error);
        throw error;
    }
}

/**
 * 특정 시험과 문제들 조회
 */
export async function getExamWithQuestions(examId: string): Promise<ExamWithQuestions> {
    try {
        // 시험 기본 정보 조회
        const { data: examData, error: examError } = await supabase
            .from('exams')
            .select(
                `
                id,
                course_id,
                title,
                description_md,
                pass_score,
                time_limit_minutes,
                question_count,
                created_at,
                updated_at,
                courses!inner (
                    id,
                    title
                )
            `
            )
            .eq('id', examId)
            .single();

        if (examError || !examData) throw examError || new Error('Exam not found');

        // 시험 문제들 조회
        const { data: questionsData, error: questionsError } = await supabase.from('exam_questions').select('*').eq('exam_id', examId).order('order_index', { ascending: true });

        if (questionsError) throw questionsError;

        const questions: ExamQuestion[] = (questionsData || []).map((q: any) => ({
            id: q.id,
            examId: q.exam_id,
            questionText: q.question_text,
            questionType: q.question_type,
            choices: q.choices,
            correctAnswer: q.correct_answer,
            points: q.points,
            orderIndex: q.order_index,
            createdAt: q.created_at,
            updatedAt: q.updated_at
        }));

        return {
            id: examData.id,
            courseId: examData.course_id,
            title: examData.title,
            descriptionMd: examData.description_md,
            passScore: examData.pass_score,
            timeLimitMinutes: examData.time_limit_minutes,
            questionCount: examData.question_count,
            createdAt: examData.created_at,
            updatedAt: examData.updated_at,
            questions,
            course: {
                id: (examData.courses as any).id,
                title: (examData.courses as any).title
            }
        };
    } catch (error) {
        console.error('시험 상세 조회 오류:', error);
        throw error;
    }
}

/**
 * 새 시험 생성
 */
export async function createExam(request: CreateExamRequest): Promise<string> {
    try {
        const { data, error } = await supabase
            .from('exams')
            .insert({
                course_id: request.courseId,
                title: request.title,
                description_md: request.descriptionMd,
                pass_score: request.passScore,
                time_limit_minutes: request.timeLimitMinutes,
                question_count: 0 // 초기값
            })
            .select('id')
            .single();

        if (error || !data) throw error || new Error('Failed to create exam');

        return data.id;
    } catch (error) {
        console.error('시험 생성 오류:', error);
        throw error;
    }
}

/**
 * 시험 정보 수정
 */
export async function updateExam(request: UpdateExamRequest): Promise<void> {
    try {
        const { error } = await supabase
            .from('exams')
            .update({
                title: request.title,
                description_md: request.descriptionMd,
                pass_score: request.passScore,
                time_limit_minutes: request.timeLimitMinutes,
                updated_at: new Date().toISOString()
            })
            .eq('id', request.id);

        if (error) throw error;
    } catch (error) {
        console.error('시험 수정 오류:', error);
        throw error;
    }
}

/**
 * 시험 삭제
 */
export async function deleteExam(examId: string): Promise<void> {
    try {
        const { error } = await supabase.from('exams').delete().eq('id', examId);

        if (error) throw error;
    } catch (error) {
        console.error('시험 삭제 오류:', error);
        throw error;
    }
}

/**
 * 시험 문제 추가
 */
export async function createExamQuestion(request: CreateExamQuestionRequest): Promise<string> {
    try {
        const { data, error } = await supabase
            .from('exam_questions')
            .insert({
                exam_id: request.examId,
                question_text: request.questionText,
                question_type: request.questionType,
                choices: request.choices,
                correct_answer: request.correctAnswer,
                points: request.points,
                order_index: request.orderIndex
            })
            .select('id')
            .single();

        if (error || !data) throw error || new Error('Failed to create question');

        // 시험의 question_count 업데이트
        await updateExamQuestionCount(request.examId);

        return data.id;
    } catch (error) {
        console.error('문제 생성 오류:', error);
        throw error;
    }
}

/**
 * 시험 문제 수정
 */
export async function updateExamQuestion(request: UpdateExamQuestionRequest): Promise<void> {
    try {
        const { error } = await supabase
            .from('exam_questions')
            .update({
                question_text: request.questionText,
                question_type: request.questionType,
                choices: request.choices,
                correct_answer: request.correctAnswer,
                points: request.points,
                order_index: request.orderIndex,
                updated_at: new Date().toISOString()
            })
            .eq('id', request.id);

        if (error) throw error;
    } catch (error) {
        console.error('문제 수정 오류:', error);
        throw error;
    }
}

/**
 * 시험 문제 삭제
 */
export async function deleteExamQuestion(questionId: string, examId: string): Promise<void> {
    try {
        const { error } = await supabase.from('exam_questions').delete().eq('id', questionId);

        if (error) throw error;

        // 시험의 question_count 업데이트
        await updateExamQuestionCount(examId);
    } catch (error) {
        console.error('문제 삭제 오류:', error);
        throw error;
    }
}

/**
 * 시험의 문제 수 업데이트
 */
async function updateExamQuestionCount(examId: string): Promise<void> {
    try {
        const { count } = await supabase.from('exam_questions').select('*', { count: 'exact', head: true }).eq('exam_id', examId);

        await supabase
            .from('exams')
            .update({
                question_count: count || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', examId);
    } catch (error) {
        console.error('문제 수 업데이트 오류:', error);
        // 이 오류는 치명적이지 않으므로 throw하지 않음
    }
}

/**
 * 문제 순서 재정렬
 */
export async function reorderExamQuestions(examId: string, questionIds: string[]): Promise<void> {
    try {
        const updates = questionIds.map((id, index) =>
            supabase
                .from('exam_questions')
                .update({
                    order_index: index + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
        );

        await Promise.all(updates);
    } catch (error) {
        console.error('문제 순서 변경 오류:', error);
        throw error;
    }
}

import type { CreateExamRequest, UpdateExamRequest, CreateExamQuestionRequest, UpdateExamQuestionRequest } from '@main/types/examManagement';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@main/lib/queryKeys';
import {
    getExamsForAdmin,
    getExamWithQuestions,
    createExam,
    updateExam,
    deleteExam,
    createExamQuestion,
    updateExamQuestion,
    deleteExamQuestion,
    reorderExamQuestions
} from '@main/services/examManagementService';

/**
 * 관리자용 시험 목록 조회 Hook
 */
export function useExamsForAdmin() {
    return useQuery({
        queryKey: qk.adminExams(),
        queryFn: getExamsForAdmin,
        staleTime: 5 * 60 * 1000 // 5분
    });
}

/**
 * 시험 상세 정보 및 문제들 조회 Hook
 */
export function useExamWithQuestions(examId: string) {
    return useQuery({
        queryKey: qk.examWithQuestions(examId),
        queryFn: () => getExamWithQuestions(examId),
        enabled: !!examId,
        staleTime: 2 * 60 * 1000 // 2분
    });
}

/**
 * 시험 생성 Mutation Hook
 */
export function useCreateExam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreateExamRequest) => createExam(request),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: qk.adminExams()
            });
        }
    });
}

/**
 * 시험 수정 Mutation Hook
 */
export function useUpdateExam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: UpdateExamRequest) => updateExam(request),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: qk.adminExams()
            });
            queryClient.invalidateQueries({
                queryKey: qk.examWithQuestions(variables.id)
            });
        }
    });
}

/**
 * 시험 삭제 Mutation Hook
 */
export function useDeleteExam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (examId: string) => deleteExam(examId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: qk.adminExams()
            });
        }
    });
}

/**
 * 시험 문제 생성 Mutation Hook
 */
export function useCreateExamQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreateExamQuestionRequest) => createExamQuestion(request),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: qk.adminExams()
            });
            queryClient.invalidateQueries({
                queryKey: qk.examWithQuestions(variables.examId)
            });
        }
    });
}

/**
 * 시험 문제 수정 Mutation Hook
 */
export function useUpdateExamQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: UpdateExamQuestionRequest) => updateExamQuestion(request),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: qk.adminExams()
            });
            if (variables.examId) {
                queryClient.invalidateQueries({
                    queryKey: qk.examWithQuestions(variables.examId)
                });
            }
        }
    });
}

/**
 * 시험 문제 삭제 Mutation Hook
 */
export function useDeleteExamQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ questionId, examId }: { questionId: string; examId: string }) => deleteExamQuestion(questionId, examId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: qk.adminExams()
            });
            queryClient.invalidateQueries({
                queryKey: qk.examWithQuestions(variables.examId)
            });
        }
    });
}

/**
 * 문제 순서 재정렬 Mutation Hook
 */
export function useReorderExamQuestions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ examId, questionIds }: { examId: string; questionIds: string[] }) => reorderExamQuestions(examId, questionIds),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: qk.adminExams()
            });
            queryClient.invalidateQueries({
                queryKey: qk.examWithQuestions(variables.examId)
            });
        }
    });
}

/**
 * React Query Key 모음 (규칙: 051 문서 참조)
 * 기본 패턴
 *  - 단일 리소스: ['course', id]
 *  - 하위 컬렉션: ['lessons', courseId]
 *  - 페이지네이션: ['reviews', { courseId, page }]
 * 페이지네이션 표준 파라미터 객체 규칙
 *  { page: number, pageSize?: number, ...filters }
 *  - pageSize 는 필요 시 명시 (기본값 서버/훅 내부 정의 가능)
 *  - filters 객체 키는 서버 쿼리 파라미터와 1:1 (status, courseId 등)
 * Support 예시
 *  useSupportTicketsPaged → queryKey: [...qk.supportTickets(), { page, pageSize, status }]
 *  useSupportMessagesPaged → [...qk.supportMessages(ticketId), { page, pageSize }]
 */

import { stableFilters } from '@main/lib/stableFilters';

export const qk = {
    course: (id: string) => ['course', id] as const,
    lessons: (courseId: string) => ['lessons', courseId] as const,
    // 티켓 목록 (filters 객체는 status 등 필터만, page/pageSize 는 훅이 확장해서 key 구성)
    supportTickets: (filters?: { status?: string }) => ['supportTickets', filters ?? {}] as const,
    supportTicket: (id: string) => ['supportTicket', id] as const,
    // 메시지 목록 (page/pageSize 확장 동일 규칙)
    supportMessages: (ticketId: string) => ['supportMessages', ticketId] as const,
    faqList: () => ['faqList'] as const,
    faqItem: (slug: string) => ['faqItem', slug] as const,
    // Certificates
    certificate: (id: string) => ['certificate', id] as const,
    certificates: (userId?: string) => ['certificates', userId ?? 'me'] as const,
    // Exams
    exam: (id: string) => ['exam', id] as const,
    examQuestions: (examId: string) => ['examQuestions', examId] as const,
    // Exam Attempts
    examAttempts: (filter: { examId?: string; enrollmentId?: string }) => ['examAttempts', filter] as const,
    // Categories (관리자)
    categories: () => ['categories'] as const,
    // Admin Users (검색/페이지 필터 객체 포함)
    adminUsers: (filters: { q?: string; page?: number; pageSize?: number }) => ['adminUsers', stableFilters(filters)] as const,
    // Courses (목록)
    courses: (filters: { page: number; pageSize: number; q?: string; categoryId?: string }) => ['courses', stableFilters(filters)] as const,
    // Instructor Courses (내부 - 초안 포함)
    instructorCourses: (filters: { instructorId: string; page: number; pageSize: number; includeUnpublished?: boolean }) => ['instructorCourses', stableFilters(filters)] as const,
    // Instructor Public Courses (공개된 것만)
    instructorPublicCourses: (filters: { instructorId: string; page: number; pageSize: number }) => ['instructorPublicCourses', stableFilters(filters)] as const,
    // Notices (공지 목록)
    notices: (filters: { page: number; pageSize: number; includePinnedFirst?: boolean }) => ['notices', stableFilters(filters)] as const,
    // Instructor Applications (관리자)
    instructorApps: (filters: { bucket: string; page: number; pageSize: number; search?: string }) => ['instructorApps', stableFilters(filters)] as const,
    // Course Reviews (페이지네이션)
    reviews: (filters: { courseId: string; page: number; pageSize: number; sort?: string }) => ['reviews', stableFilters(filters)] as const,
    // Course QnA (페이지네이션)
    qna: (filters: { courseId: string; page: number; pageSize: number; viewerId?: string }) => ['qna', stableFilters(filters)] as const,
    // Dashboard
    dashboardStats: () => ['dashboardStats'] as const,
    topCourses: (limit: number) => ['topCourses', limit] as const,
    activeStudents: (limit: number) => ['activeStudents', limit] as const,
    revenueChart: (months: number) => ['revenueChart', months] as const,
    examStats: () => ['examStats'] as const,
    // Admin Exam Management
    adminExams: () => ['adminExams'] as const,
    examWithQuestions: (examId: string) => ['examWithQuestions', examId] as const,
    // Courses for exam creation
    coursesForExam: () => ['coursesForExam'] as const
};

export type QueryKey = ReturnType<(typeof qk)[keyof typeof qk]>;

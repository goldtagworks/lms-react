/**
 * React Query Key 모음 (규칙: 051 문서 참조)
 * 기존 패턴: ['course',id], ['lessons',courseId], ['enrollment',id], ...
 * 신규 추가: 리뷰/ Q&A
 */

export const qk = {
    course: (id: string) => ['course', id] as const,
    lessons: (courseId: string) => ['lessons', courseId] as const,
    reviews: (courseId: string, page: number) => ['reviews', { courseId, page }] as const,
    qna: (courseId: string, page: number) => ['qna', { courseId, page }] as const,
    answers: (questionId: string) => ['answers', questionId] as const,
    courseRating: (courseId: string) => ['courseRating', courseId] as const,
    supportTickets: (filters?: { status?: string }) => ['supportTickets', filters ?? {}] as const,
    supportTicket: (id: string) => ['supportTicket', id] as const,
    supportMessages: (ticketId: string) => ['supportMessages', ticketId] as const,
    faqList: () => ['faqList'] as const,
    faqItem: (slug: string) => ['faqItem', slug] as const
};

export type QueryKey = ReturnType<(typeof qk)[keyof typeof qk]>;

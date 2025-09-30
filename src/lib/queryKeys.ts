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

export const qk = {
    course: (id: string) => ['course', id] as const,
    lessons: (courseId: string) => ['lessons', courseId] as const,
    reviews: (courseId: string, page: number) => ['reviews', { courseId, page }] as const,
    qna: (courseId: string, page: number) => ['qna', { courseId, page }] as const,
    answers: (questionId: string) => ['answers', questionId] as const,
    courseRating: (courseId: string) => ['courseRating', courseId] as const,
    // 티켓 목록 (filters 객체는 status 등 필터만, page/pageSize 는 훅이 확장해서 key 구성)
    supportTickets: (filters?: { status?: string }) => ['supportTickets', filters ?? {}] as const,
    supportTicket: (id: string) => ['supportTicket', id] as const,
    // 메시지 목록 (page/pageSize 확장 동일 규칙)
    supportMessages: (ticketId: string) => ['supportMessages', ticketId] as const,
    faqList: () => ['faqList'] as const,
    faqItem: (slug: string) => ['faqItem', slug] as const
};

export type QueryKey = ReturnType<(typeof qk)[keyof typeof qk]>;

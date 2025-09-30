// Support (1:1 문의) 관련 타입 정의
// NOTE: 서버 스키마 (support_tickets, support_ticket_messages) 기준 ViewModel 분리

export type SupportTicketStatus = 'OPEN' | 'ANSWERED' | 'CLOSED';

export interface SupportTicket {
    id: string;
    user_id: string; // 생성자
    title: string;
    status: SupportTicketStatus;
    category: string | null;
    last_message_at: string;
    created_at: string;
    updated_at: string;
}

export interface SupportTicketMessage {
    id: string;
    ticket_id: string;
    author_id: string;
    body: string;
    is_private: boolean;
    created_at: string;
    updated_at: string;
}

// ViewModel 예시: 목록 카드용 (파생 필드 서버 계산 금지 - 주석)
export interface SupportTicketCardVM {
    id: string;
    title: string;
    status: SupportTicketStatus; // 표시 목적
    // effectiveLastMessageAt: string; // 서버 계산 값 (추후 서버 필드 확정 후 사용)
}

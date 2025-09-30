// Placeholder repository/API layer for Support feature
// 실제 Supabase 클라이언트 연동 전 타입/쿼리 키 중심 스텁
import type { PaginatedResult } from '@main/types/pagination';

import { SupportTicket, SupportTicketMessage } from './types';

// 임시 인메모리 스토어 (초기 UI 개발용)
const _tickets: SupportTicket[] = [];
const _messages: SupportTicketMessage[] = [];

export function listSupportTickets(): Promise<SupportTicket[]> {
    return Promise.resolve(_tickets);
}

export function listSupportTicketsPaged(page: number, pageSize: number, status?: SupportTicket['status']): Promise<PaginatedResult<SupportTicket>> {
    const arr = _tickets.filter((t) => (status ? t.status === status : true)).sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
    const total = arr.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items = arr.slice(start, start + pageSize);

    return Promise.resolve({ items, page: safePage, pageSize, total, pageCount });
}

export function getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    return Promise.resolve(_tickets.find((t) => t.id === id));
}

export function listSupportMessages(ticketId: string): Promise<SupportTicketMessage[]> {
    return Promise.resolve(_messages.filter((m) => m.ticket_id === ticketId));
}

export function listSupportMessagesPaged(ticketId: string, page: number, pageSize: number): Promise<PaginatedResult<SupportTicketMessage>> {
    const arr = _messages.filter((m) => m.ticket_id === ticketId).sort((a, b) => a.created_at.localeCompare(b.created_at)); // 오래된 -> 최신 순 (UI에서 reverse 필요 시 변경)
    const total = arr.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const items = arr.slice(start, start + pageSize);

    return Promise.resolve({ items, page: safePage, pageSize, total, pageCount });
}

export function createSupportTicket(data: { title: string; body: string; category?: string | null }): Promise<SupportTicket> {
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
        id: crypto.randomUUID(),
        user_id: 'me',
        title: data.title,
        status: 'OPEN',
        category: data.category ?? null,
        last_message_at: now,
        created_at: now,
        updated_at: now
    };

    _tickets.push(ticket);
    _messages.push({
        id: crypto.randomUUID(),
        ticket_id: ticket.id,
        author_id: 'me',
        body: data.body,
        is_private: false,
        created_at: now,
        updated_at: now
    });

    return Promise.resolve(ticket);
}

export function createSupportMessage(ticketId: string, data: { body: string; is_private?: boolean; authorId?: string }): Promise<SupportTicketMessage> {
    const now = new Date().toISOString();
    const msg: SupportTicketMessage = {
        id: crypto.randomUUID(),
        ticket_id: ticketId,
        author_id: data.authorId ?? 'me',
        body: data.body,
        is_private: !!data.is_private,
        created_at: now,
        updated_at: now
    };

    _messages.push(msg);

    const t = _tickets.find((t) => t.id === ticketId);

    if (t) {
        t.last_message_at = now;
        t.updated_at = now;
    }

    return Promise.resolve(msg);
}

export function updateTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<SupportTicket | undefined> {
    const t = _tickets.find((t) => t.id === ticketId);

    if (t) {
        t.status = status;
        t.updated_at = new Date().toISOString();
    }

    return Promise.resolve(t);
}

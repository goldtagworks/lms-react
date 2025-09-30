import type { PaginatedResult } from '@main/types/pagination';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '../../lib/queryKeys';

import { createSupportTicket, getSupportTicket, listSupportMessages, listSupportTickets, listSupportTicketsPaged, listSupportMessagesPaged } from './api';

export function useSupportTickets() {
    return useQuery({ queryKey: qk.supportTickets(), queryFn: () => listSupportTickets() });
}

export function useSupportTicketsPaged(page: number, pageSize: number, status?: string) {
    return useQuery<PaginatedResult<any>>({
        queryKey: [...qk.supportTickets(), { page, pageSize, status }],
        queryFn: () => listSupportTicketsPaged(page, pageSize, status as any)
    });
}

export function useSupportTicket(id: string) {
    return useQuery({ queryKey: qk.supportTicket(id), queryFn: () => getSupportTicket(id), enabled: !!id });
}

export function useSupportMessages(ticketId: string) {
    return useQuery({ queryKey: qk.supportMessages(ticketId), queryFn: () => listSupportMessages(ticketId), enabled: !!ticketId });
}

export function useSupportMessagesPaged(ticketId: string, page: number, pageSize: number) {
    return useQuery<PaginatedResult<any>>({
        queryKey: [...qk.supportMessages(ticketId), { page, pageSize }],
        queryFn: () => listSupportMessagesPaged(ticketId, page, pageSize),
        enabled: !!ticketId
    });
}

export function useCreateSupportTicket() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: createSupportTicket,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qk.supportTickets() });
        }
    });
}

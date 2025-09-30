import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '../../lib/queryKeys';

import { createSupportTicket, getSupportTicket, listSupportMessages, listSupportTickets } from './api';

export function useSupportTickets() {
    return useQuery({ queryKey: qk.supportTickets(), queryFn: () => listSupportTickets() });
}

export function useSupportTicket(id: string) {
    return useQuery({ queryKey: qk.supportTicket(id), queryFn: () => getSupportTicket(id), enabled: !!id });
}

export function useSupportMessages(ticketId: string) {
    return useQuery({ queryKey: qk.supportMessages(ticketId), queryFn: () => listSupportMessages(ticketId), enabled: !!ticketId });
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

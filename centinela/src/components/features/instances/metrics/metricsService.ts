import { apiClient } from '@/services/apiClient';

interface WsTicketResponse {
    ticket?: string;
}

export async function getWsTicket(): Promise<string> {
    const response = await apiClient.post<WsTicketResponse>(
        '/auth/ws-ticket',
        undefined,
        { expectedStatus: 200 },
    );

    if (typeof response?.ticket !== 'string' || response.ticket.trim().length === 0) {
        throw new Error(
            'La API no devolvió un ticket WebSocket válido.',
        );
    }
    return response.ticket;
}

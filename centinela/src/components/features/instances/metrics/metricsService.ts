import { sendJsonPostRequest } from "@/services/api";

interface WsTicketResponse {
    ticket?: string;
}

export async function getWsTicket(): Promise<string> {
    const response = (await sendJsonPostRequest(
        'auth/ws-ticket',
        undefined,
        { expectedStatus: 200 },
    )) as WsTicketResponse;

    if (typeof response?.ticket !== 'string' || response.ticket.trim().length === 0) {
        throw new Error(
            'La API no devolvió un ticket WebSocket válido.',
        );
    }
    return response.ticket;
}

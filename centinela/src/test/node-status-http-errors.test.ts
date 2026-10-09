import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/services/apiClient';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('node status HTTP gateway errors', () => {
    it.each([502, 504])('convierte una respuesta HTTP %s en ApiRequestError', async (httpStatus) => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(
            JSON.stringify({ message: 'Gateway temporalmente no disponible' }),
            { status: httpStatus, headers: { 'Content-Type': 'application/json' } },
        ));
        vi.stubGlobal('fetch', fetchMock);

        await expect(apiClient.get('node/status')).rejects.toMatchObject({
            name: 'ApiRequestError',
            status: httpStatus,
            message: 'Gateway temporalmente no disponible',
        });
        expect(fetchMock).toHaveBeenCalledWith('/api/node/status', expect.objectContaining({ method: 'GET' }));
    });
});
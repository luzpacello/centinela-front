import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/apiClient', () => ({
    apiClient: { get: vi.fn() },
}));

import { apiClient } from '@/services/apiClient';
import { getNodeStatus } from '@/components/features/dashboard/services/nodeStatusService';
import { formatUptime } from '@/components/features/dashboard/utils/formatUptime';

describe('node status service', () => {
    it('consulta el endpoint con la señal de cancelación', async () => {
        const signal = new AbortController().signal;
        vi.mocked(apiClient.get).mockResolvedValueOnce({} as never);

        await getNodeStatus(signal);

        expect(apiClient.get).toHaveBeenCalledWith('node/status', { signal });
    });
});

describe('formatUptime', () => {
    it('formatea días, horas y minutos sin mostrar unidades vacías', () => {
        expect(formatUptime(3 * 86400 + 5 * 3600 + 12 * 60)).toBe('3d 5h 12m');
        expect(formatUptime(45 * 60)).toBe('45m');
        expect(formatUptime(86400)).toBe('1d');
        expect(formatUptime(0)).toBe('0m');
    });
});
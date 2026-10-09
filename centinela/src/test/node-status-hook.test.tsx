import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/features/dashboard/services/nodeStatusService', () => ({
    getNodeStatus: vi.fn(),
}));

import { getNodeStatus, type NodeStatusResponse } from '@/components/features/dashboard/services/nodeStatusService';
import { useNodeStatus } from '@/components/features/dashboard/hooks/useNodeStatus';
import { ApiRequestError } from '@/services/apiClient';

const status: NodeStatusResponse = {
    cpu: { usagePercent: 69, cores: 16 },
    ram: { usedGb: 42.25, totalGb: 128, usagePercent: 33.01 },
    storage: { usedGb: 42.25, totalGb: 128, usagePercent: 33.01 },
    uptimeSeconds: 86400,
    instancesSummary: {
        vms: { running: 6, stopped: 2, paused: 1, total: 9 },
        lxc: { running: 6, stopped: 2, paused: 1, total: 9 },
    },
    stale: false,
    fetchedAt: '2026-10-03T14:30:05Z',
};

function setVisibilityState(state: DocumentVisibilityState) {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
}

beforeEach(() => {
    vi.mocked(getNodeStatus).mockReset();
    setVisibilityState('visible');
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('useNodeStatus', () => {
    it('consulta inmediatamente y vuelve a consultar cada 10 segundos', async () => {
        vi.useFakeTimers();
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        const { result } = renderHook(() => useNodeStatus());
        await act(async () => { await Promise.resolve(); });

        expect(getNodeStatus).toHaveBeenCalledTimes(1);
        expect(result.current.data).toEqual(status);
        expect(result.current.health).toBe('healthy');

        act(() => { vi.advanceTimersByTime(10_000); });
        expect(getNodeStatus).toHaveBeenCalledTimes(2);
    });

    it('no consulta con la pestaña oculta y reanuda al volver a estar visible', async () => {
        vi.useFakeTimers();
        vi.mocked(getNodeStatus).mockResolvedValue(status);
        setVisibilityState('hidden');

        renderHook(() => useNodeStatus());
        expect(getNodeStatus).not.toHaveBeenCalled();

        setVisibilityState('visible');
        act(() => { document.dispatchEvent(new Event('visibilitychange')); });
        await act(async () => { await Promise.resolve(); });
        expect(getNodeStatus).toHaveBeenCalledTimes(1);

        setVisibilityState('hidden');
        act(() => { document.dispatchEvent(new Event('visibilitychange')); });
        act(() => { vi.advanceTimersByTime(20_000); });
        expect(getNodeStatus).toHaveBeenCalledTimes(1);
    });

    it('marca advertencia desde 70% y permite reintentar después de un error', async () => {
        vi.useFakeTimers();
        vi.mocked(getNodeStatus)
            .mockResolvedValueOnce({ ...status, ram: { ...status.ram, usagePercent: 70 } })
            .mockRejectedValueOnce(new Error('Sin conexión'))
            .mockResolvedValueOnce(status);

        const { result } = renderHook(() => useNodeStatus());
        await act(async () => { await Promise.resolve(); });
        expect(result.current.health).toBe('warning');

        await act(async () => { vi.advanceTimersByTime(10_000); });
        expect(result.current.health).toBe('inaccessible');

        act(() => { result.current.retry(); });
        await act(async () => { await Promise.resolve(); });
        expect(result.current.health).toBe('healthy');
        expect(getNodeStatus).toHaveBeenCalledTimes(3);
    });

    it.each([502, 504])('marca el nodo inaccesible cuando el servicio responde %s', async (httpStatus) => {
        vi.useFakeTimers();
        vi.mocked(getNodeStatus).mockRejectedValueOnce(new ApiRequestError('Error de gateway', httpStatus));

        const { result } = renderHook(() => useNodeStatus());
        await act(async () => { await Promise.resolve(); });

        expect(result.current.health).toBe('inaccessible');
        expect(result.current.error).toMatchObject({ status: httpStatus });
    });
});
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/context/EventsContext', () => ({
    useEventsContext: () => ({ estado: 'open', motivoCierre: null }),
}));

vi.mock('@/components/features/dashboard/services/nodeStatusService', () => ({
    getNodeStatus: vi.fn(),
}));

import { getNodeStatus, type NodeStatusResponse } from '@/components/features/dashboard/services/nodeStatusService';
import Dashboard from '@/pages/Dashboard';

const status: NodeStatusResponse = {
    cpu: { usagePercent: 37.5, cores: 16 },
    ram: { usedGb: 42.25, totalGb: 128, usagePercent: 33.01 },
    storage: { usedGb: 75, totalGb: 128, usagePercent: 70 },
    uptimeSeconds: 86400,
    instancesSummary: {
        vms: { running: 6, stopped: 2, paused: 1, total: 9 },
        lxc: { running: 6, stopped: 2, paused: 1, total: 9 },
    },
    stale: false,
    fetchedAt: '2026-10-03T14:30:05Z',
};

beforeEach(() => {
    vi.mocked(getNodeStatus).mockReset();
});

describe('Dashboard node status', () => {
    it('muestra skeleton inicial y luego telemetría, uptime y aviso stale', async () => {
        let resolveRequest!: (value: NodeStatusResponse) => void;
        vi.mocked(getNodeStatus).mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));

        render(<Dashboard />);
        expect(screen.getByLabelText('Cargando telemetría')).toBeInTheDocument();

        await act(async () => { resolveRequest({ ...status, stale: true }); });

        expect(await screen.findByText(/Datos desactualizados/)).toBeInTheDocument();
        expect(screen.getByText('37.5%')).toBeInTheDocument();
        expect(screen.getByText('33.01%')).toBeInTheDocument();
        expect(screen.getByText('1d')).toBeInTheDocument();
        expect(screen.getAllByText('Advertencia').length).toBeGreaterThan(0);
    });

    it('muestra inaccesible y permite reintentar sin recargar', async () => {
        vi.mocked(getNodeStatus)
            .mockRejectedValueOnce(new Error('Sin conexión'))
            .mockResolvedValueOnce({ ...status, storage: { ...status.storage, usagePercent: 69 } });

        render(<Dashboard />);
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(screen.getAllByText('Inaccesible').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: /Reintentar conexión/ }));

        expect((await screen.findAllByText('Saludable')).length).toBeGreaterThan(0);
        expect(getNodeStatus).toHaveBeenCalledTimes(2);
    });
});
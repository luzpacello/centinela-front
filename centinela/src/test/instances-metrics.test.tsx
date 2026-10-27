import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Instances from '@/pages/Instances';
import { formatCpuUsage, formatRamUsage } from '@/components/features/instances/utils/formatInstanceTelemetry';

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ user: null, isAdmin: () => true, canAccessInstance: () => true }),
}));

vi.mock('@/components/features/instances/hooks/useInstances', () => ({
    useInstances: () => ({
        instances: [
            { id: 101, name: 'vm-encendida', type: 'VM', node: 'pve-01', status: 'running', ip: null, cpuUsage: 25, ramUsage: 2147483648, maxRam: 8589934592, activeTask: null },
            { id: 102, name: 'lxc-apagado', type: 'LXC', node: 'pve-01', status: 'stopped', ip: null, cpuUsage: null, ramUsage: null, maxRam: null, activeTask: null },
        ],
        isLoading: false,
        errorMessage: null,
        reloadInventory: vi.fn(),
        revalidateInventory: vi.fn(),
        pendingPowerActions: {},
        markPowerActionAccepted: vi.fn(),
        transitioningTasks: {},
    }),
}));

vi.mock('@/components/features/instances/components/InstanceAction', () => ({ default: () => null }));
describe('métricas del inventario de instancias', () => {
    it('formatea CPU en la escala de porcentaje 0 a 100', () => {
        expect(formatCpuUsage(25)).toBe('25%');
        expect(formatCpuUsage(0)).toBe('0%');
        expect(formatCpuUsage(null)).toBe('—');
        expect(formatCpuUsage(undefined)).toBe('—');
        expect(formatCpuUsage(-1)).toBe('—');
    });

    it('formatea RAM en GB y representa los valores ausentes con em-dash', () => {
        expect(formatRamUsage(2147483648, 8589934592)).toBe('2.00 GB / 8.00 GB');
        expect(formatRamUsage(null, 8589934592)).toBe('—');
        expect(formatRamUsage(undefined)).toBe('—');
        expect(formatRamUsage(-1)).toBe('—');
    });

    it('muestra las métricas reales y centra los guiones de una instancia apagada', () => {
        render(<MemoryRouter><Instances /></MemoryRouter>);

        const rows = within(screen.getByRole('table', { name: 'Inventario de instancias' })).getAllByRole('row');
        const runningRow = rows.find((row) => within(row).queryByText('vm-encendida'));
        const stoppedRow = rows.find((row) => within(row).queryByText('lxc-apagado'));

        expect(runningRow).toBeDefined();
        expect(stoppedRow).toBeDefined();
        expect(within(runningRow!).getByText('25%')).toBeInTheDocument();
        expect(within(runningRow!).getByText('2.00 GB / 8.00 GB')).toBeInTheDocument();
        const missingMetrics = within(stoppedRow!).getAllByText('—');
        expect(missingMetrics).toHaveLength(2);
        missingMetrics.forEach((cell) => expect(cell).toHaveClass('text-center'));
    });
});

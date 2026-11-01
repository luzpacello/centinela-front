import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/features/instances/components/InstanceResourceFields', () => ({
    default: () => null,
}));

import InstanceResourcesPanel from '@/components/features/instances/components/detail/InstanceResourcesPanel';

describe('InstanceResourcesPanel', () => {
    it('formatea magnitudes a un decimal y acota porcentajes inválidos', () => {
        render(
            <InstanceResourcesPanel
                values={{} as never}
                current={{} as never}
                editor={{
                    nodeStatus: {
                        cpu: { usagePercent: Number.NaN, cores: 4 },
                        ram: { usedGb: 1.234, totalGb: 2.345, usagePercent: 130 },
                        storage: { usedGb: 9, totalGb: 5, usagePercent: -20 },
                    },
                } as never}
                status="running"
                canEdit={false}
                isSaving={false}
                onChange={vi.fn()}
                onEditResources={vi.fn()}
            />,
        );

        expect(screen.getByText('—')).toBeInTheDocument();
        expect(screen.getByText('1.2 / 2.3 GB')).toBeInTheDocument();
        expect(screen.getByText('9 / 5 GB')).toBeInTheDocument();
        expect(screen.queryByText(/NaN|Infinity|—% de uso/)).not.toBeInTheDocument();

        const ramBar = screen.getByRole('progressbar', { name: 'Uso de Memoria RAM' });
        const storageBar = screen.getByRole('progressbar', { name: 'Uso de Almacenamiento' });
        expect(ramBar).toHaveAttribute('aria-valuenow', '100');
        expect(ramBar.firstElementChild).toHaveStyle({ width: '100%' });
        expect(storageBar).toHaveAttribute('aria-valuenow', '0');
        expect(storageBar.firstElementChild).toHaveStyle({ width: '0%' });
        expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
    });
});

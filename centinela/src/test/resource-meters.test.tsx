import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CpuGauge, RamMeter, StorageMeter } from '@/components/features/dashboard/components/ResourceMeter';

describe('ResourceMeters', () => {
    it('renderiza estado normal en 69%', () => {
        render(
            <CpuGauge
                percent={69}
                usedCores={7}
                totalCores={10}
            />
        );

        const meter = screen.getByTestId('cpu-meter');
        expect(meter).toHaveAttribute('data-state', 'normal');
        expect(screen.getByText('69%')).toBeInTheDocument();
        expect(screen.getByText('7 de 10 núcleos')).toBeInTheDocument();
    });

    it('conmuta a advertencia al alcanzar 70%', () => {
        render(
            <CpuGauge
                percent={70}
                usedCores={8}
                totalCores={10}
            />
        );

        const meter = screen.getByTestId('cpu-meter');
        expect(meter).toHaveAttribute('data-state', 'warning');
        expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('muestra valores dinámicos y unidades de RAM y almacenamiento', () => {
        const { rerender } = render(
            <>
                <RamMeter usedGb={12.4} totalGb={32} />
                <StorageMeter usedGb={510} totalGb={1024} />
            </>
        );

        expect(screen.getByText('12.4 GB / 32 GB')).toBeInTheDocument();
        expect(screen.getByText('39%')).toBeInTheDocument();
        expect(screen.getByText('510 GB / 1.0 TB')).toBeInTheDocument();

        rerender(
            <StorageMeter usedGb={750} totalGb={1000} />
        );

        expect(screen.getByText('75%')).toBeInTheDocument();
    });
});

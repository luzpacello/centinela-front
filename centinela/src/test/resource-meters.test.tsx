import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CpuGauge, RamMeter, StorageMeter } from '@/components/features/dashboard/components/ResourceMeter';

describe('ResourceMeters', () => {
    it('renderiza estado normal en 69%', () => {
        render(
            <CpuGauge
                percent={69}
                cores={10}
            />
        );

        const meter = screen.getByTestId('cpu-meter');
        expect(meter).toHaveAttribute('data-state', 'normal');
        expect(screen.getByText('69%')).toBeInTheDocument();
        expect(screen.getByText('10 hilos lógicos')).toBeInTheDocument();
    });

    it('conmuta a advertencia al alcanzar 70%', () => {
        render(
            <CpuGauge
                percent={70}
                cores={10}
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
        expect(screen.getByText('38.75%')).toBeInTheDocument();
        expect(screen.getByText('510 GB / 1 TB')).toBeInTheDocument();

        rerender(
            <StorageMeter usedGb={750} totalGb={1000} />
        );

        expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('dibuja la curva de tendencia con las muestras recibidas', () => {
        render(
            <CpuGauge
                percent={30}
                cores={8}
                samples={[10, 20, 15, 30]}
            />
        );

        const sparkline = screen.getByTestId('cpu-meter-sparkline');
        const points = sparkline.querySelector('polyline')?.getAttribute('points')?.trim();
        expect(points?.split(/\s+/)).toHaveLength(4);
        expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('se banca una sola muestra dibujando una línea plana', () => {
        render(
            <StorageMeter usedGb={510} totalGb={1024} samples={[42]} />
        );

        expect(screen.getByTestId('storage-meter-sparkline')).toBeInTheDocument();
        expect(screen.getByText('49.8%')).toBeInTheDocument();
    });

    function nivelPlano(testId: string): number {
        const points =
            screen.getByTestId(testId).querySelector('polyline')?.getAttribute('points') ?? '';
        const niveles = points
            .trim()
            .split(/\s+/)
            .map((punto) => Number(punto.split(',')[1]));

        expect(new Set(niveles).size, 'La serie plana no es una línea horizontal').toBe(1);

        return niveles[0];
    }

    it('ubica la línea plana al nivel real de la métrica y no al medio', () => {
        const bajo = render(
            <RamMeter usedGb={25.6} totalGb={128} usagePercent={20} samples={[20, 20, 20]} />
        );
        const nivelBajo = nivelPlano('ram-meter-sparkline');
        bajo.unmount();

        render(
            <RamMeter usedGb={102.4} totalGb={128} usagePercent={80} samples={[80, 80, 80]} />
        );
        const nivelAlto = nivelPlano('ram-meter-sparkline');

        expect(nivelAlto, 'Una RAM al 80% no puede quedar por debajo de una al 20%').toBeLessThan(
            nivelBajo,
        );
        expect(nivelBajo).toBeGreaterThan(0);
        expect(nivelAlto).toBeGreaterThan(0);
    });
});

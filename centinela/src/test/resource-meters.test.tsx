import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CpuGauge, RamMeter, StorageMeter } from '@/components/features/dashboard/components/ResourceMeter';

describe('ResourceMeters', () => {
    it('dibuja la tendencia compacta sin círculos ni cambios de escala o tamaño', () => {
        render(<CpuGauge percent={0.2} cores={8} samples={[0.1, 0.2, 0.15]} compact />);

        const chart = screen.getByTestId('cpu-meter-sparkline');
        const line = chart.querySelector('polyline');
        const end = line?.getAttribute('points')?.trim().split(/\s+/).at(-1)?.split(',');

        expect(chart).toHaveClass('h-9');
        expect(line).toHaveAttribute('stroke-width', '2.5');
        expect(chart.querySelector('polygon')).toHaveAttribute('fill', 'url(#cpu-meter-compact-gradient)');
        expect(chart.querySelector('circle')).toBeNull();
        expect(chart.querySelector('line')).toHaveAttribute('y1', '25');
        expect(Number(end?.[1])).toBeGreaterThan(20);
    });

    it('no dibuja un punto de tendencia cuando el compacto no tiene historial', () => {
        render(<RamMeter usedGb={3.35} totalGb={15.3} samples={[]} compact />);

        expect(screen.getByTestId('ram-meter-sparkline').querySelector('circle')).toBeNull();
        expect(screen.getByText('Sin historial')).toBeInTheDocument();
    });

    it('muestra el almacenamiento como anillo en el resumen compacto', () => {
        render(<StorageMeter usedGb={10.74} totalGb={67.73} usagePercent={15.85} variant="ring" />);

        expect(screen.getByRole('progressbar', { name: 'Uso de almacenamiento' })).toHaveAttribute('aria-valuenow', '15.85');
        expect(screen.getByText('15.85%')).toBeInTheDocument();
        expect(screen.queryByText('10.74 GB / 67.73 GB')).not.toBeInTheDocument();
        expect(screen.getByText('10.74 GB de 67.73 GB')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Almacenamiento' }).parentElement?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
        expect(screen.queryByTestId('storage-meter-sparkline')).not.toBeInTheDocument();
    });
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

    it('no inventa una tendencia con una sola muestra', () => {
        render(
            <StorageMeter usedGb={510} totalGb={1024} samples={[42]} />
        );

        expect(screen.getByTestId('storage-meter-sparkline').querySelector('polyline')).toBeNull();
        expect(screen.getByText('Sin historial')).toBeInTheDocument();
        expect(screen.getByText('49.8%')).toBeInTheDocument();
    });

    it('no representa una serie vacía como uso cero', () => {
        render(<RamMeter usedGb={3.35} totalGb={15.3} samples={[]} />);
        expect(screen.getByTestId('ram-meter-sparkline').querySelector('polyline')).toBeNull();
        expect(screen.getByText('Sin historial')).toBeInTheDocument();
    });

    it('mantiene el tiempo real entre muestras sin estirarlas a todo el ancho', () => {
        render(<RamMeter usedGb={3.35} totalGb={15.3} samples={[20, 22]} timestamps={[1000, 1010]} />);
        const points = screen.getByTestId('ram-meter-sparkline').querySelector('polyline')?.getAttribute('points') ?? '';
        expect(Number(points.trim().split(' ')[0].split(',')[0])).toBeGreaterThan(90);
        expect(Number(points.trim().split(' ')[1].split(',')[0])).toBe(100);
    });

    it('no une puntos anteriores a la última hora con el valor actual', () => {
        render(<RamMeter usedGb={3.35} totalGb={15.3} samples={[20, 22]} timestamps={[1000, 3602000]} />);
        expect(screen.getByTestId('ram-meter-sparkline').querySelector('polyline')).toBeNull();
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

    function alturas(testId: string): number[] {
        const points =
            screen.getByTestId(testId).querySelector('polyline')?.getAttribute('points') ?? '';

        return points
            .trim()
            .split(/\s+/)
            .map((punto) => Number(punto.split(',')[1]));
    }

    it('no estira una serie de valores bajos contra el rango observado', () => {
        render(<CpuGauge percent={0.2} cores={8} samples={[0.1, 0.2, 0.15]} />);

        const alturasSerie = alturas('cpu-meter-sparkline');

        // Con escala fija 0–100, valores por debajo del 1% quedan cerca del piso
        // (y alto) y no se estiran de borde a borde.
        expect(Math.min(...alturasSerie)).toBeGreaterThan(20);
        expect(Math.max(...alturasSerie) - Math.min(...alturasSerie)).toBeLessThan(2);
    });

    it('ignora las muestras sin dato en vez de romper la curva', () => {
        render(
            <RamMeter
                usedGb={3.35}
                totalGb={15.3}
                usagePercent={21.9}
                samples={[undefined, 21.9, undefined, 21.8]}
            />
        );

        const sparkline = screen.getByTestId('ram-meter-sparkline');
        const points = sparkline.querySelector('polyline')?.getAttribute('points') ?? '';

        expect(points).not.toContain('NaN');
        expect(alturas('ram-meter-sparkline').every((y) => Number.isFinite(y))).toBe(true);
    });

    it('rellena el área bajo la curva para que el nivel se lea de un vistazo', () => {
        render(<StorageMeter usedGb={10.73} totalGb={67.73} usagePercent={15.84} samples={[15.8, 15.84]} />);

        const area = screen
            .getByTestId('storage-meter-sparkline')
            .querySelector('polygon');

        expect(area).not.toBeNull();
        expect(area?.getAttribute('points')).toContain('28');
    });
});

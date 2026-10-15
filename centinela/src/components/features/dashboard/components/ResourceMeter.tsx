import { Cpu, MemoryStick, HardDrive } from 'lucide-react';

// Lógica central de saturación (se mantiene igual para cumplir con el DoD)
const getThresholdClasses = (percent: number) => {
    if (percent >= 70) {
        return {
            stroke: 'stroke-amber-500',
            text: 'text-amber-700',
        };
    }
    return {
        stroke: 'stroke-emerald-500',
        text: 'text-emerald-600',
    };
};

const SPARKLINE_WIDTH = 100;
const SPARKLINE_HEIGHT = 28;

// Convierte las muestras reales del sondeo en puntos SVG. La escala usa el rango
// observado (mínimo y máximo de la ventana): con datos casi planos —el simulador
// se mueve décimas— una escala absoluta deja la curva recta y no se ve la
// tendencia. Sin variación real dibuja una línea al medio, sin inventar picos.
function buildSparklinePoints(samples: number[]): string {
    const safe = samples.map((value) => Math.max(0, Math.min(100, value)));
    if (safe.length === 0) return `0,${SPARKLINE_HEIGHT} ${SPARKLINE_WIDTH},${SPARKLINE_HEIGHT}`;

    const min = Math.min(...safe);
    const max = Math.max(...safe);
    const range = max - min;
    // Margen vertical para que la curva no toque los bordes del gráfico.
    const padding = 3;
    const usable = SPARKLINE_HEIGHT - padding * 2;

    const levelFor = (value: number) => {
        if (range < 0.01) return SPARKLINE_HEIGHT / 2;
        return padding + (1 - (value - min) / range) * usable;
    };

    if (safe.length === 1) {
        const level = (SPARKLINE_HEIGHT / 2).toFixed(2);
        return `0,${level} ${SPARKLINE_WIDTH},${level}`;
    }

    return safe
        .map((value, index) => {
            const x = (index / (safe.length - 1)) * SPARKLINE_WIDTH;
            return `${x.toFixed(2)},${levelFor(value).toFixed(2)}`;
        })
        .join(' ');
}

interface BaseMeterProps {
    title: string;
    icon: React.ElementType;
    percent: number;
    details: string;
    testId: string;
    iconTheme: string; // Nueva propiedad para recuperar los colores originales
    // Color del trazo: el mismo que el del ícono, para que la curva y el medidor
    // se lean como una sola pieza.
    strokeTheme: string;
    samples?: number[];
}

function BaseMeter({ title, icon: Icon, percent, details, testId, iconTheme, strokeTheme, samples }: BaseMeterProps) {
    const safePercent = Math.max(0, Math.min(100, percent));
    const theme = getThresholdClasses(safePercent);
    const displayedPercent = Number(safePercent.toFixed(2));

    return (
        <div
            className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-colors"
            data-testid={testId}
            data-state={safePercent >= 70 ? 'warning' : 'normal'}
        >
            {/* Cabecera del medidor */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {/* Contenedor del ícono: Recuperamos el diseño circular y colorido original */}
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${iconTheme}`}>
                        <Icon className="size-5" aria-hidden="true" />
                    </div>
                    {/* Título un poco más grande */}
                    <span className="text-base font-semibold tracking-tight text-slate-900">{title}</span>
                </div>
                {/* Detalles (ej. 12GB / 32GB) */}
                <span className="text-sm font-medium text-slate-500">{details}</span>
            </div>

            {/* Curva de tendencia con las muestras reales del sondeo + porcentaje vivo */}
            <div className="flex items-center gap-4">
                <svg
                    data-testid={`${testId}-sparkline`}
                    viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={`Tendencia de uso de ${title}`}
                    className="h-12 w-full flex-1"
                >
                    <polyline
                        points={buildSparklinePoints(samples ?? [])}
                        fill="none"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-all duration-500 ${strokeTheme}`}
                    />
                </svg>
                {/* Porcentaje numérico */}
                <span className={`w-16 text-right text-base font-bold tracking-tight ${theme.text}`}>
                    {displayedPercent}%
                </span>
            </div>
        </div>
    );
}

export function CpuGauge({ percent, cores, samples }: { percent: number; cores: number; samples?: number[] }) {
    return (
        <BaseMeter
            title="CPU"
            icon={Cpu}
            percent={percent}
            details={`${cores} hilos lógicos`}
            testId="cpu-meter"
            iconTheme="bg-emerald-50 text-emerald-700" // Verde original
            strokeTheme="stroke-emerald-700"
            samples={samples}
        />
    );
}

function formatGb(value: number): string {
    return `${Number(value.toFixed(2))} GB`;
}

export function RamMeter({ usedGb, totalGb, usagePercent, samples }: { usedGb: number; totalGb: number; usagePercent?: number; samples?: number[] }) {
    const percent = usagePercent ?? (totalGb > 0 ? (usedGb / totalGb) * 100 : 0);
    return (
        <BaseMeter
            title="Memoria RAM"
            icon={MemoryStick}
            percent={percent}
            details={`${formatGb(usedGb)} / ${formatGb(totalGb)}`}
            testId="ram-meter"
            iconTheme="bg-blue-50 text-blue-600" // Azul original
            strokeTheme="stroke-blue-600"
            samples={samples}
        />
    );
}

export function StorageMeter({ usedGb, totalGb, usagePercent, samples }: { usedGb: number; totalGb: number; usagePercent?: number; samples?: number[] }) {
    const percent = usagePercent ?? (totalGb > 0 ? (usedGb / totalGb) * 100 : 0);
    const formatStorage = (gb: number) => gb >= 1000 ? `${Number((gb / 1024).toFixed(2))} TB` : formatGb(gb);

    return (
        <BaseMeter
            title="Almacenamiento"
            icon={HardDrive}
            percent={percent}
            details={`${formatStorage(usedGb)} / ${formatStorage(totalGb)}`}
            testId="storage-meter"
            iconTheme="bg-purple-50 text-purple-600" // Morado original
            strokeTheme="stroke-purple-600"
            samples={samples}
        />
    );
}

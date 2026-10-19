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
const SPARKLINE_PADDING = 3;

// Escala fija 0–100: la altura del gráfico siempre significa el mismo porcentaje.
// Un 22% se lee bajo pero no en cero, y una suba real no se exagera como si la
// métrica hubiera caído desde el 100%.
function nivelY(percent: number): number {
    const usable = SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2;
    return SPARKLINE_PADDING + (1 - Math.max(0, Math.min(100, percent)) / 100) * usable;
}

// Curva y área que la rellena. Las muestras sin dato se ignoran: el backend omite
// ramPercent/storagePercent cuando el punto del RRD no trae su total, y una
// muestra ausente no tiene que romper la curva.
function buildSparklinePaths(samples: Array<number | undefined>, timestamps?: number[]): { line: string; area: string } | null {
    const latest = timestamps?.length === samples.length ? Math.max(...timestamps) : NaN;
    const timed = Number.isFinite(latest) && timestamps?.every(Number.isFinite);
    const windowStart = latest - 60 * 60 * 1000;
    const validas = samples.map((value, index) => ({ value, index })).filter(
        (point): point is { value: number; index: number } => typeof point.value === 'number' && Number.isFinite(point.value),
    ).filter(({ index }) => !timed || timestamps![index] >= windowStart);
    const piso = SPARKLINE_HEIGHT.toFixed(2);

    if (validas.length < 2) return null;

    const puntos = validas.map(({ value, index }) => ({
        x: (timed
            ? Math.max(0, Math.min(1, (timestamps![index] - windowStart) / (60 * 60 * 1000))) * SPARKLINE_WIDTH
            : (index / (samples.length - 1)) * SPARKLINE_WIDTH).toFixed(2),
        y: nivelY(value).toFixed(2),
    }));
    const line = puntos.map((punto) => `${punto.x},${punto.y}`).join(' ');

    return { line, area: `${puntos[0].x},${piso} ${line} ${puntos[puntos.length - 1].x},${piso}` };
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
    // Relleno del área bajo la curva: el nivel se lee como una banda, no como una
    // línea suelta que puede confundirse con el cero.
    fillTheme: string;
    gradientColor: string;
    samples?: Array<number | undefined>;
    timestamps?: number[];
    compact?: boolean;
}

function BaseMeter({ title, icon: Icon, percent, details, testId, iconTheme, strokeTheme, fillTheme, gradientColor, samples, timestamps, compact }: BaseMeterProps) {
    const safePercent = Math.max(0, Math.min(100, percent));
    const theme = getThresholdClasses(safePercent);
    const displayedPercent = Number(safePercent.toFixed(2));
    const sparkline = buildSparklinePaths(samples ?? [], timestamps);

    if (compact) {
        return (
            <div className="min-w-0" data-testid={testId} data-state={safePercent >= 70 ? 'warning' : 'normal'}>
                <div className="flex items-center gap-2">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${iconTheme}`}><Icon className="size-4" aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{title}</p>
                        <p className="truncate text-xs text-slate-500" title={details}>{details}</p>
                    </div>
                    <span className={`text-sm font-semibold ${theme.text}`}>{displayedPercent}%</span>
                </div>
                <div className="relative mt-2">
                    <svg data-testid={`${testId}-sparkline`} viewBox={`-2 0 ${SPARKLINE_WIDTH + 4} ${SPARKLINE_HEIGHT}`} preserveAspectRatio="none" role="img" aria-label={sparkline ? `Tendencia de uso de ${title} en la última hora` : `Sin historial de ${title}`} className="h-9 w-full">
                        {sparkline && <>
                            <defs>
                                <linearGradient id={`${testId}-compact-gradient`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={gradientColor} stopOpacity="0.25" />
                                    <stop offset="100%" stopColor={gradientColor} stopOpacity="0.02" />
                                </linearGradient>
                            </defs>
                            <line x1="0" x2={SPARKLINE_WIDTH} y1="25" y2="25" strokeDasharray="2 3" className="stroke-slate-300" />
                            <polygon points={sparkline.area} stroke="none" fill={`url(#${testId}-compact-gradient)`} />
                            <polyline points={sparkline.line} fill="none" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className={strokeTheme} />
                        </>}
                    </svg>
                    {!sparkline && <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">Sin historial</span>}
                </div>
            </div>
        );
    }

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

            {/* La tendencia y el porcentaje actual son distintos: sin historial no significa cero. */}
            <div className="flex items-center gap-4">
                <div className="relative min-w-0 flex-1">
                    <svg
                        data-testid={`${testId}-sparkline`}
                        viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
                        preserveAspectRatio="none"
                        role="img"
                        aria-label={sparkline ? `Tendencia de uso de ${title} en la última hora` : `Sin historial de ${title}`}
                        className="h-12 w-full"
                    >
                        {sparkline && <>
                            <polygon points={sparkline.area} stroke="none" className={fillTheme} />
                            <polyline
                                points={sparkline.line}
                                fill="none"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={strokeTheme}
                            />
                        </>}
                    </svg>
                    {!sparkline && <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">Sin historial</span>}
                </div>
                {/* Porcentaje numérico */}
                <span className={`w-16 text-right text-base font-bold tracking-tight ${theme.text}`}>
                    {displayedPercent}%
                </span>
            </div>
            <span className="text-xs text-slate-500">Última hora</span>
        </div>
    );
}

export function CpuGauge({ percent, cores, samples, timestamps, compact }: { percent: number; cores: number; samples?: Array<number | undefined>; timestamps?: number[]; compact?: boolean }) {
    return (
        <BaseMeter
            title="CPU"
            icon={Cpu}
            percent={percent}
            details={`${cores} hilos lógicos`}
            testId="cpu-meter"
            iconTheme="bg-emerald-50 text-emerald-700" // Verde original
            strokeTheme="stroke-emerald-700"
            fillTheme="fill-emerald-700/15"
            gradientColor="#047857"
            samples={samples}
            timestamps={timestamps}
            compact={compact}
        />
    );
}

function formatGb(value: number): string {
    return `${Number(value.toFixed(2))} GB`;
}

export function RamMeter({ usedGb, totalGb, usagePercent, samples, timestamps, compact }: { usedGb: number; totalGb: number; usagePercent?: number; samples?: Array<number | undefined>; timestamps?: number[]; compact?: boolean }) {
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
            fillTheme="fill-blue-600/15"
            gradientColor="#2563eb"
            samples={samples}
            timestamps={timestamps}
            compact={compact}
        />
    );
}

export function StorageMeter({ usedGb, totalGb, usagePercent, samples, timestamps, variant }: { usedGb: number; totalGb: number; usagePercent?: number; samples?: Array<number | undefined>; timestamps?: number[]; variant?: 'ring' }) {
    const percent = usagePercent ?? (totalGb > 0 ? (usedGb / totalGb) * 100 : 0);
    const formatStorage = (gb: number) => gb >= 1000 ? `${Number((gb / 1024).toFixed(2))} TB` : formatGb(gb);

    if (variant === 'ring') {
        const safePercent = Math.max(0, Math.min(100, percent));
        const displayedPercent = Number(safePercent.toFixed(2));
        return (
            <div className="flex min-w-0 flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4" data-testid="storage-meter" data-state={safePercent >= 70 ? 'warning' : 'normal'}>
                <div className="w-full text-left"><h4 className="text-sm font-semibold text-slate-900">Almacenamiento</h4><p className="text-xs text-slate-500">{formatStorage(usedGb)} / {formatStorage(totalGb)}</p></div>
                <div role="progressbar" aria-label="Uso de almacenamiento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={displayedPercent} className="relative grid size-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#9333ea ${safePercent}%, #e9d5ff ${safePercent}% 100%)` }}>
                    <span className="grid size-[84%] place-items-center rounded-full bg-white text-xl font-semibold text-slate-900">{displayedPercent}%</span>
                </div>
                <span className="text-center text-xs text-slate-600">{formatStorage(usedGb)} de {formatStorage(totalGb)}</span>
            </div>
        );
    }

    return (
        <BaseMeter
            title="Almacenamiento"
            icon={HardDrive}
            percent={percent}
            details={`${formatStorage(usedGb)} / ${formatStorage(totalGb)}`}
            testId="storage-meter"
            iconTheme="bg-purple-50 text-purple-600" // Morado original
            strokeTheme="stroke-purple-600"
            fillTheme="fill-purple-600/15"
            gradientColor="#9333ea"
            samples={samples}
            timestamps={timestamps}
        />
    );
}

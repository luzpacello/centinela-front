import { Cpu, MemoryStick, HardDrive } from 'lucide-react';

// Lógica central de saturación (se mantiene igual para cumplir con el DoD)
const getThresholdClasses = (percent: number) => {
    if (percent >= 70) {
        return {
            bar: 'bg-amber-500',
            text: 'text-amber-700',
        };
    }
    return {
        bar: 'bg-emerald-500',
        text: 'text-emerald-600',
    };
};

interface BaseMeterProps {
    title: string;
    icon: React.ElementType;
    percent: number;
    details: string;
    testId: string;
    iconTheme: string; // Nueva propiedad para recuperar los colores originales
}

function BaseMeter({ title, icon: Icon, percent, details, testId, iconTheme }: BaseMeterProps) {
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

            {/* Barra de progreso y porcentaje vivo */}
            <div className="flex items-center gap-4">
                <div
                    className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={safePercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
                        style={{ width: `${safePercent}%` }}
                    />
                </div>
                {/* Porcentaje numérico */}
                <span className={`w-16 text-right text-base font-bold tracking-tight ${theme.text}`}>
                    {displayedPercent}%
                </span>
            </div>
        </div>
    );
}

export function CpuGauge({ percent, cores }: { percent: number; cores: number }) {
    return (
        <BaseMeter
            title="CPU"
            icon={Cpu}
            percent={percent}
            details={`${cores} hilos lógicos`}
            testId="cpu-meter"
            iconTheme="bg-emerald-50 text-emerald-700" // Verde original
        />
    );
}

function formatGb(value: number): string {
    return `${Number(value.toFixed(2))} GB`;
}

export function RamMeter({ usedGb, totalGb, usagePercent }: { usedGb: number; totalGb: number; usagePercent?: number }) {
    const percent = usagePercent ?? (totalGb > 0 ? (usedGb / totalGb) * 100 : 0);
    return (
        <BaseMeter
            title="Memoria RAM"
            icon={MemoryStick}
            percent={percent}
            details={`${formatGb(usedGb)} / ${formatGb(totalGb)}`}
            testId="ram-meter"
            iconTheme="bg-blue-50 text-blue-600" // Azul original
        />
    );
}

export function StorageMeter({ usedGb, totalGb, usagePercent }: { usedGb: number; totalGb: number; usagePercent?: number }) {
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
        />
    );
}
import { Cpu, MemoryStick, HardDrive } from 'lucide-react';

// Lógica central de saturación (se mantiene igual para cumplir con el DoD)
const getThresholdClasses = (percent: number) => {
    if (percent >= 70) {
        return {
            bar: 'bg-rose-500',
            text: 'text-rose-600',
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
    iconTheme: string; // Nueva propiedad para recuperar los colores originales
}

function BaseMeter({ title, icon: Icon, percent, details, iconTheme }: BaseMeterProps) {
    const safePercent = Math.max(0, Math.min(100, percent));
    const theme = getThresholdClasses(safePercent);

    return (
        <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-colors">
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
                <span className={`w-11 text-right text-base font-bold tracking-tight ${theme.text}`}>
                    {Math.round(safePercent)}%
                </span>
            </div>
        </div>
    );
}

export function CpuGauge({ percent, usedCores, totalCores }: { percent: number; usedCores: number; totalCores: number }) {
    return (
        <BaseMeter
            title="CPU"
            icon={Cpu}
            percent={percent}
            details={`${usedCores} / ${totalCores} núcleos`}
            iconTheme="bg-emerald-50 text-emerald-700" // Verde original
        />
    );
}

export function RamMeter({ usedGb, totalGb }: { usedGb: number; totalGb: number }) {
    const percent = totalGb > 0 ? (usedGb / totalGb) * 100 : 0;
    return (
        <BaseMeter
            title="Memoria RAM"
            icon={MemoryStick}
            percent={percent}
            details={`${usedGb.toFixed(1)} / ${totalGb.toFixed(1)} GB`}
            iconTheme="bg-blue-50 text-blue-600" // Azul original
        />
    );
}

export function StorageMeter({ usedGb, totalGb }: { usedGb: number; totalGb: number }) {
    const percent = totalGb > 0 ? (usedGb / totalGb) * 100 : 0;
    const formatStorage = (gb: number) => gb >= 1000 ? `${(gb / 1024).toFixed(1)} TB` : `${Math.round(gb)} GB`;

    return (
        <BaseMeter
            title="Almacenamiento"
            icon={HardDrive}
            percent={percent}
            details={`${formatStorage(usedGb)} / ${formatStorage(totalGb)}`}
            iconTheme="bg-purple-50 text-purple-600" // Morado original
        />
    );
}
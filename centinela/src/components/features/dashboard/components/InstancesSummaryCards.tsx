import { Box, Container } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Conteo por tipo de recurso (RF-02): las tarjetas del Dashboard muestran el
// total consolidado, y estas lo desglosan en máquinas virtuales (QEMU) y
// contenedores (LXC) con su estado operativo. Los números salen del
// instancesSummary que ya devuelve GET /api/node/status.
export interface InstanceTypeSummary {
    running: number;
    stopped: number;
    paused: number;
    total: number;
}

export interface InstancesSummary {
    vms: InstanceTypeSummary;
    lxc: InstanceTypeSummary;
}

interface InstancesSummaryCardsProps {
    summary?: InstancesSummary;
    isLoading?: boolean;
    compact?: boolean;
}

function TypeCard({ title, detail, summary, icon: Icon, accent, testId, compact }: {
    title: string;
    detail: string;
    summary?: InstanceTypeSummary;
    icon: React.ElementType;
    accent: string;
    testId: string;
    compact?: boolean;
}) {
    const formatCount = (value?: number) => (typeof value === 'number' ? value.toLocaleString('es') : '—');

    if (compact) {
        return (
            <div className="min-w-0 space-y-2" data-testid={testId}>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900"><span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${accent}`}><Icon className="size-4" aria-hidden="true" /></span>{title}</h3>
                <p className="text-xs text-slate-600">{formatCount(summary?.total)} total</p>
                <p className="flex items-center gap-2 text-xs text-slate-700"><span className={style.greenDot} />{formatCount(summary?.running)} <span>En ejecución</span></p>
                <p className="flex items-center gap-2 text-xs text-slate-700"><span className={style.grayDot} />{formatCount(summary?.stopped)} <span>Detenidas</span></p>
                {(summary?.paused ?? 0) > 0 && <p className="text-xs text-slate-600">{formatCount(summary?.paused)} pausadas</p>}
            </div>
        );
    }

    return (
        <Card className={style.card} data-testid={testId}>
            <div className={style.header}>
                <span className={`${style.icon} ${accent}`}>
                    <Icon className={style.iconGlyph} aria-hidden="true" />
                </span>
                <div>
                    <h3 className={style.title}>{title}</h3>
                    <p className={style.detail}>{detail}</p>
                </div>
            </div>

            <div className={style.metrics}>
                <div className={style.metric}>
                    <span className={style.metricValue}>{formatCount(summary?.total)}</span>
                    <span className={style.metricLabel}>Total</span>
                </div>
                <div className={style.metric}>
                    <span className={`${style.metricValue} text-emerald-700`}>{formatCount(summary?.running)}</span>
                    <span className={style.metricLabel}>
                        <span className={style.greenDot} aria-hidden="true" />En ejecución
                    </span>
                </div>
                <div className={style.metric}>
                    <span className={`${style.metricValue} text-slate-600`}>{formatCount(summary?.stopped)}</span>
                    <span className={style.metricLabel}>
                        <span className={style.grayDot} aria-hidden="true" />Detenidas
                    </span>
                </div>
            </div>
        </Card>
    );
}

export default function InstancesSummaryCards({ summary, isLoading, compact = false }: InstancesSummaryCardsProps) {
    // Sin datos todavía: skeletons con el mismo grid responsivo que las tarjetas.
    if (isLoading && !summary) {
        return (
            <div className={compact ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : style.grid}>
                <div className={style.skeleton} aria-label="Cargando conteo de máquinas virtuales" />
                <div className={style.skeleton} aria-label="Cargando conteo de contenedores" />
            </div>
        );
    }

    return (
        <div className={compact ? 'grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2 sm:divide-x sm:divide-slate-200' : style.grid}>
            <TypeCard
                title="Máquinas virtuales (QEMU)"
                detail="Instancias de tipo VM"
                summary={summary?.vms}
                icon={Box}
                accent="bg-emerald-50 text-emerald-700"
                testId="summary-vms"
                compact={compact}
            />
            <TypeCard
                title="Contenedores (LXC)"
                detail="Instancias de tipo CT"
                summary={summary?.lxc}
                icon={Container}
                accent="bg-blue-50 text-blue-600"
                testId="summary-lxc"
                compact={compact}
            />
        </div>
    );
}

const style = {
    grid: 'grid grid-cols-1 gap-4 sm:grid-cols-2',
    card: 'gap-0 rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    header: 'flex items-center gap-4',
    icon: 'flex size-12 shrink-0 items-center justify-center rounded-2xl',
    iconGlyph: 'size-5',
    title: 'text-sm font-semibold text-slate-900',
    detail: 'text-xs text-slate-500',
    metrics: 'mt-4 grid grid-cols-3 gap-2',
    metric: 'flex flex-col gap-1',
    metricValue: 'text-2xl font-semibold leading-tight text-slate-900',
    metricLabel: 'flex items-center gap-1 text-xs text-slate-500',
    greenDot: 'size-2 rounded-full bg-green-700',
    grayDot: 'size-2 rounded-full bg-slate-400',
    skeleton: 'h-[132px] animate-pulse rounded-xl border border-slate-100 bg-slate-100',
};

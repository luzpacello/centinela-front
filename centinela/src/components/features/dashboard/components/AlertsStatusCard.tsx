import { useNavigate } from 'react-router';
import { ChevronRight, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { InventoryInstance } from '@/components/features/instances/types/instance';

interface AlertsStatusCardProps {
    instances: InventoryInstance[];
    templatesCount: number | null;
    isLoading: boolean;
}

function stoppedLabel(count: number): string {
    return count === 1 ? '1 instancia detenida' : `${count} instancias detenidas`;
}

function templatesLabel(count: number): string {
    return count === 1 ? '1 plantilla disponible' : `${count} plantillas disponibles`;
}

// Panel "Alertas y estado" del Dashboard, derivado de datos reales: instancias
// detenidas y catálogo de plantillas. Sin "Acciones rápidas": ese bloque está
// tachado en la pantalla final y no se implementa.
export default function AlertsStatusCard({ instances, templatesCount, isLoading }: AlertsStatusCardProps) {
    const navigate = useNavigate();
    const stoppedCount = instances.filter(
        (instance) => instance.status === 'stopped' || instance.status === 'paused',
    ).length;
    const templatesAvailable = templatesCount ?? 0;
    const allClear = stoppedCount === 0 && templatesAvailable === 0;

    return (
        <Card className={style.card}>
            <div className={style.header}>
                <h4 className={style.title}>Alertas y estado</h4>
            </div>

            {isLoading ? (
                <div className="flex flex-col gap-3" aria-label="Cargando alertas y estado">
                    <div className={style.rowSkeleton} />
                    <div className={style.rowSkeleton} />
                </div>
            ) : (
                <ul className={style.list}>
                    {allClear && (
                        <li className={style.row}>
                            <span className={`${style.rowIcon} bg-emerald-50 text-emerald-700`} aria-hidden="true">
                                <CircleCheck className={style.rowIconGlyph} />
                            </span>
                            <div className={style.rowBody}>
                                <span className={style.rowName}>Todo en orden</span>
                                <span className={style.rowMeta}>No hay alertas ni incidencias.</span>
                            </div>
                        </li>
                    )}
                    {stoppedCount > 0 && (
                        <li className={`${style.row} ${style.rowWarning}`}>
                            <span className={`${style.rowIcon} bg-orange-100/70 text-orange-600`} aria-hidden="true">
                                <TriangleAlert className={style.rowIconGlyph} />
                            </span>
                            <div className={style.rowBody}>
                                <span className={style.rowName}>{stoppedLabel(stoppedCount)}</span>
                                <span className={style.rowMeta}>Hay instancias detenidas que requieren atención.</span>
                            </div>
                            <button
                                type="button"
                                className={style.chevron}
                                aria-label="Ver instancias detenidas"
                                onClick={() => navigate('/instances')}
                            >
                                <ChevronRight className={style.rowIconGlyph} />
                            </button>
                        </li>
                    )}
                    {templatesAvailable > 0 && (
                        <li className={`${style.row} ${style.rowInfo}`}>
                            <span className={`${style.rowIcon} bg-blue-100/70 text-blue-600`} aria-hidden="true">
                                <Info className={style.rowIconGlyph} />
                            </span>
                            <div className={style.rowBody}>
                                <span className={style.rowName}>{templatesLabel(templatesAvailable)}</span>
                                <span className={style.rowMeta}>Hay plantillas listas para usar.</span>
                            </div>
                        </li>
                    )}
                </ul>
            )}
        </Card>
    );
}

const style = {
    card: 'flex min-h-[340px] flex-col gap-3 rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    header: 'flex items-center justify-between gap-2',
    title: 'text-sm font-semibold text-slate-900',
    list: 'flex flex-1 flex-col gap-2',
    row: 'flex items-center gap-3 rounded-lg py-2',
    rowWarning: '-mx-1 bg-orange-50/70 px-3',
    rowInfo: '-mx-1 bg-blue-50/70 px-3',
    rowIcon: 'flex size-9 shrink-0 items-center justify-center rounded-full',
    rowIconGlyph: 'size-4',
    rowBody: 'flex min-w-0 flex-1 flex-col',
    rowName: 'text-sm font-medium text-slate-900',
    rowMeta: 'text-xs text-slate-500',
    chevron: 'ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-orange-100/70 hover:text-slate-600',
    rowSkeleton: 'h-12 animate-pulse rounded-lg border border-slate-100 bg-slate-100',
};

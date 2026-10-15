import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, CirclePlay, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { formatMemoryBytes } from '@/components/features/instances/utils/formatInstanceTelemetry';
import type { InventoryInstance } from '@/components/features/instances/types/instance';

const MAX_RECENT_INSTANCES = 5;

// Estados con el texto y los acentos que muestra la pantalla final del Dashboard.
const STATUS_PRESENTATION: Record<string, { label: string; chip: string; icon: string }> = {
    running: { label: 'En ejecución', chip: 'bg-emerald-50 text-emerald-700', icon: 'bg-emerald-50 text-emerald-700' },
    stopped: { label: 'Detenida', chip: 'bg-slate-100 text-slate-600', icon: 'bg-slate-100 text-slate-500' },
    paused: { label: 'Pausada', chip: 'bg-amber-50 text-amber-700', icon: 'bg-amber-50 text-amber-600' },
};

function buildInstanceMeta(instance: InventoryInstance): string {
    const parts: string[] = [instance.type];
    if (typeof instance.maxRam === 'number' && instance.maxRam > 0) {
        parts.push(`${formatMemoryBytes(instance.maxRam)} RAM`);
    }
    return parts.join(' · ');
}

interface RecentInstancesCardProps {
    instances: InventoryInstance[];
    isLoading: boolean;
    errorMessage: string | null;
    reloadInventory: () => void;
}

// Panel "Instancias recientes" del Dashboard: primeras cinco instancias del
// inventario (respetando los permisos de acceso), con accesos directos al
// listado completo. Sin datos simulados: carga, error y vacío son reales.
export default function RecentInstancesCard({ instances, isLoading, errorMessage, reloadInventory }: RecentInstancesCardProps) {
    const navigate = useNavigate();
    const { canAccessInstance } = useAuth();
    const recentInstances = useMemo(
        () => instances.filter((instance) => canAccessInstance(instance.id)).slice(0, MAX_RECENT_INSTANCES),
        [instances, canAccessInstance],
    );

    const goToInstances = () => navigate('/instances');

    return (
        <Card className={style.card}>
            <div className={style.header}>
                <h4 className={style.title}>Instancias recientes</h4>
                <Button type="button" variant="ghost" className={style.headerAction} onClick={goToInstances}>
                    Ver todas
                </Button>
            </div>

            {isLoading && instances.length === 0 ? (
                <div className="flex flex-col gap-3" aria-label="Cargando instancias recientes">
                    {[0, 1, 2, 3, 4].map((row) => <div key={row} className={style.rowSkeleton} />)}
                </div>
            ) : errorMessage ? (
                <div className={style.stateBox} role="alert">
                    <span>{errorMessage}</span>
                    <Button type="button" variant="outline" className={style.stateAction} onClick={reloadInventory}>
                        Reintentar
                    </Button>
                </div>
            ) : recentInstances.length === 0 ? (
                <div className={style.stateBox}>Todavía no hay instancias para mostrar.</div>
            ) : (
                <ul className={style.list}>
                    {recentInstances.map((instance) => {
                        const presentation = STATUS_PRESENTATION[instance.status] ?? {
                            label: instance.status,
                            chip: 'bg-slate-100 text-slate-600',
                            icon: 'bg-slate-100 text-slate-500',
                        };
                        return (
                            <li key={instance.id} className={style.row}>
                                <span className={`${style.rowIcon} ${presentation.icon}`} aria-hidden="true">
                                    {instance.status === 'running'
                                        ? <CirclePlay className={style.rowIconGlyph} />
                                        : <Square className={style.rowIconGlyph} />}
                                </span>
                                <div className={style.rowBody}>
                                    <span className={style.rowName}>{instance.name}</span>
                                    <span className={style.rowMeta}>{buildInstanceMeta(instance)}</span>
                                </div>
                                <Badge variant="secondary" className={`border-0 ${presentation.chip}`}>{presentation.label}</Badge>
                            </li>
                        );
                    })}
                </ul>
            )}

            <Button type="button" variant="outline" className={style.footerAction} onClick={goToInstances}>
                Ver todas las instancias <ArrowRight className={style.footerIcon} />
            </Button>
        </Card>
    );
}

const style = {
    card: 'flex min-h-[340px] flex-col gap-3 rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    header: 'flex items-center justify-between gap-2',
    title: 'text-sm font-semibold text-slate-900',
    headerAction: 'h-8 px-2 text-xs text-slate-500',
    list: 'flex flex-1 flex-col divide-y divide-slate-100',
    row: 'flex items-center gap-3 py-3',
    rowIcon: 'flex size-9 shrink-0 items-center justify-center rounded-full',
    rowIconGlyph: 'size-4',
    rowBody: 'flex min-w-0 flex-1 flex-col',
    rowName: 'truncate text-sm font-medium text-slate-900',
    rowMeta: 'text-xs text-slate-500',
    rowSkeleton: 'h-12 animate-pulse rounded-lg border border-slate-100 bg-slate-100',
    stateBox: 'flex min-h-28 flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500',
    stateAction: 'h-8 text-xs',
    footerAction: 'mt-auto w-full justify-between text-xs text-blue-600',
    footerIcon: 'size-4!',
};

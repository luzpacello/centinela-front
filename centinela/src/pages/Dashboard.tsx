import { Bell, Box, CirclePlay, Clock3, Monitor, RefreshCw, Server, ShieldCheck, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CpuGauge, RamMeter, StorageMeter } from '@/components/features/dashboard/components/ResourceMeter';
import { useEventsContext, useEventSubscription } from '@/context/EventsContext';
import type { EventsClientStatus } from '@/services/eventsClient';
import { useNodeStatus, type NodeHealth } from '@/components/features/dashboard/hooks/useNodeStatus';
import { formatUptime } from '@/components/features/dashboard/utils/formatUptime';
import { useTemplates } from '@/components/features/dashboard/hooks/useTemplates';
import RecentInstancesCard from '@/components/features/dashboard/components/RecentInstancesCard';
import InstancesSummaryCards from '@/components/features/dashboard/components/InstancesSummaryCards';
import RecentActivityCard from '@/components/features/dashboard/components/RecentActivityCard';
import AlertsStatusCard from '@/components/features/dashboard/components/AlertsStatusCard';
import { useAuth } from '@/context/AuthContext';
import { useInstances } from '@/components/features/instances/hooks/useInstances';

// Traducción del estado del canal de eventos a lo que ve el operador.
const EVENTS_STATUS_PRESENTATION: Record<EventsClientStatus, { label: string; dot: string }> = {
    idle: { label: 'Sin conectar', dot: 'bg-slate-400' },
    connecting: { label: 'Conectando…', dot: 'bg-amber-500' },
    reconnecting: { label: 'Reconectando…', dot: 'bg-amber-500' },
    open: { label: 'En vivo', dot: 'bg-green-700' },
    closed: { label: 'Canal cerrado', dot: 'bg-red-600' },
    failed: { label: 'Canal caído', dot: 'bg-red-600' },
    unauthorized: { label: 'Sesión finalizada', dot: 'bg-red-600' },
};

const NODE_HEALTH_PRESENTATION: Record<NodeHealth, { label: string; className: string; textClassName: string }> = {
    loading: { label: 'Consultando nodo', className: 'border-slate-200 text-slate-600', textClassName: 'text-slate-600' },
    healthy: { label: 'Saludable', className: 'border-emerald-200 text-emerald-700', textClassName: 'text-emerald-700' },
    warning: { label: 'Advertencia', className: 'border-amber-300 text-amber-700', textClassName: 'text-amber-700' },
    inaccessible: { label: 'Inaccesible', className: 'border-red-300 text-red-700', textClassName: 'text-red-700' },
};

function formatFetchedAt(value?: string): string {
    if (!value) return 'Sin sincronizar';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin sincronizar';
    return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export default function Dashboard() {
    const { estado, motivoCierre } = useEventsContext();
    const eventsStatus = EVENTS_STATUS_PRESENTATION[estado];
    const { isAdmin } = useAuth();
    const admin = isAdmin();
    const templates = useTemplates(admin);
    const instancesData = useInstances();
    const { data, error, health, loading, retry, refetch, history } = useNodeStatus();

    // El conteo y la telemetría se revalidan apenas el nodo termina una tarea o
    // cambia el estado de una instancia, sin esperar el sondeo de 10 segundos.
    useEventSubscription({ tipo: 'TASK_FINISHED' }, refetch);
    useEventSubscription({ tipo: 'INSTANCE_STATE_CHANGED' }, refetch);
    const nodeHealth = NODE_HEALTH_PRESENTATION[health];
    const instanceSummary = data?.instancesSummary;
    const totalInstances = instanceSummary ? instanceSummary.vms.total + instanceSummary.lxc.total : null;
    const runningInstances = instanceSummary ? instanceSummary.vms.running + instanceSummary.lxc.running : null;
    const inactiveInstances = instanceSummary
        ? instanceSummary.vms.stopped + instanceSummary.vms.paused + instanceSummary.lxc.stopped + instanceSummary.lxc.paused
        : null;
    const formatCount = (value: number | null) => value === null ? '—' : value.toLocaleString('es');
    const formatShare = (value: number | null) => value === null || !totalInstances
        ? '—'
        : `${Math.round((value / totalInstances) * 100)}%`;

    return (
        <section className={style.page}>
            <header className={style.header}>
                <div>
                    <h1> ¡Hola, Admin! </h1>
                    <p className="text-secundario"> Resumen general de tus instancias y recursos.</p>
                </div>
                <div className={style.headerActions}>
                    <div className={style.profile}>
                        <Badge
                            variant="outline"
                            role="status"
                            className={style.eventsBadge}
                            title={motivoCierre ?? undefined}
                        >
                            <span className={`${style.eventsDot} ${eventsStatus.dot}`} aria-hidden="true" />
                            {eventsStatus.label}
                        </Badge>

                        <Button type="button" variant="ghost" size="icon" aria-label="Notificaciones">
                            <Bell className={style.smallIcon} />
                        </Button>

                    </div>

                </div>
            </header>

            <div className={`grid grid-cols-1 gap-4 ${admin ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`}>
                <Card className={style.summaryCard}>
                    <div className={style.cardHeader}>
                        <span className={style.greenIcon}><Monitor className={style.icon} /></span>
                        <div>
                            <p className="text-metrica">{formatCount(totalInstances)}</p>
                            <h2 className="text-caption">Instancias totales</h2>
                        </div>
                    </div>
                    <Separator className="mt-5 mb-5" />
                    <div className={style.summaryFooter}>
                        <span className="text-caption"><span className={style.greenDot} />{formatCount(runningInstances)} activas</span>
                        <span className="text-caption"><span className={style.grayDot} />{formatCount(inactiveInstances)} detenidas o pausadas</span>
                    </div>
                </Card>
                <Card className={style.summaryCard}>
                    <div className={style.cardHeader}>
                        <span className={style.greenIcon}><CirclePlay className={style.icon} /></span>
                        <div>
                            <p className="text-metrica">{formatCount(runningInstances)}</p>
                            <h2 className="text-caption">En ejecución</h2>
                        </div>
                    </div>
                    <Separator className="mt-5 mb-5" />
                    <p className="text-caption"><span className={style.greenText}>{formatShare(runningInstances)}</span> del total</p>
                </Card>
                <Card className={style.summaryCard}>
                    <div className={style.cardHeader}>
                        <span className={style.orangeIcon}><Square className={style.icon} /></span>
                        <div>
                            <p className="text-metrica">{formatCount(inactiveInstances)}</p>
                            <h2 className="text-caption">Detenidas o pausadas</h2>
                        </div>
                    </div>
                    <Separator className="mt-5 mb-5" />
                    <p className="text-caption"><span className={style.orangeText}>{formatShare(inactiveInstances)}</span> del total</p>
                </Card>
                {admin && (
                    <Card className={style.summaryCard}>
                        <div className={style.cardHeader}>
                            <span className={style.purpleIcon}><Box className={style.icon} /></span>
                            <div>
                                <p className="text-metrica">{formatCount(templates.loading ? null : templates.count)}</p>
                                <h2 className="text-caption">Plantillas</h2>
                            </div>
                        </div>
                        <Separator className="mt-5 mb-5" />
                        <p className="text-caption">Disponibles para usar</p>
                    </Card>
                )}
            </div>

            <section className={style.typeSummary}>
                <h2 className={style.typeSummaryTitle}>Conteo por tipo de recurso</h2>
                <InstancesSummaryCards summary={instanceSummary} isLoading={loading} />
            </section>

            <Card className={style.resourceCard}>
                <div className={style.sectionHeader}>
                    <div className={style.sectionHeading}>
                        <h3>Uso total de recursos</h3>
                        <Badge variant="outline" className={nodeHealth.className}>{nodeHealth.label}</Badge>
                    </div>
                    {data?.stale && (
                        <Badge variant="outline" className={style.staleBadge}>
                            Datos desactualizados (el servidor opera con última telemetría conocida)
                        </Badge>
                    )}
                </div>

                {loading && !data ? (
                    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3" aria-label="Cargando telemetría">
                        {[0, 1, 2].map((item) => <div key={item} className={style.meterSkeleton} />)}
                    </div>
                ) : data ? (
                    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <CpuGauge percent={data.cpu.usagePercent} cores={data.cpu.cores} samples={history.map((sample) => sample.cpu)} />
                        <RamMeter usedGb={data.ram.usedGb} totalGb={data.ram.totalGb} usagePercent={data.ram.usagePercent} samples={history.map((sample) => sample.ram)} />
                        <StorageMeter usedGb={data.storage.usedGb} totalGb={data.storage.totalGb} usagePercent={data.storage.usagePercent} samples={history.map((sample) => sample.storage)} />
                    </div>
                ) : null}

                {error && (
                    <div className={style.connectionError} role="alert">
                        <span>No se pudo obtener la telemetría del nodo.</span>
                        <Button type="button" variant="outline" onClick={retry}>
                            <RefreshCw className={style.smallIcon} /> Reintentar conexión
                        </Button>
                    </div>
                )}
            </Card>

            <div className={style.details}>
                <RecentInstancesCard
                    instances={instancesData.instances}
                    isLoading={instancesData.isLoading}
                    errorMessage={instancesData.errorMessage}
                    reloadInventory={instancesData.reloadInventory}
                />
                {admin && <RecentActivityCard />}
                <AlertsStatusCard
                    instances={instancesData.instances}
                    templatesCount={templates.count}
                    isLoading={instancesData.isLoading}
                />
            </div>

            <Card className={style.systemFooter}>
                <div className={style.systemStatus}>
                    <ShieldCheck className={style.systemIcon} />
                    <div><h2 className="text-destacado">Conexión</h2><p className="text-caption">{estado === 'open' ? 'Conectado' : eventsStatus.label}</p></div>
                </div>
                <div className={style.systemStatus}>
                    <Clock3 className={style.systemIcon} />
                    <div><h2 className="text-destacado">Última sincronización</h2><p className="text-caption">{formatFetchedAt(data?.fetchedAt)}</p></div>
                </div>
                <div className={style.systemStatus}>
                    <Server className={style.systemIcon} />
                    <div>
                        <h2 className="text-destacado">
                            Estado del sistema{' '}
                            <span className={nodeHealth.textClassName}>{nodeHealth.label}</span>
                        </h2>
                        <p className="text-caption">Tiempo de ejecución: {data ? formatUptime(data.uptimeSeconds) : '—'}</p>
                    </div>
                </div>
            </Card>
        </section>
    );
}

const style = {
    page: 'flex min-w-0 flex-col gap-5 text-slate-900',
    header: 'flex flex-wrap items-start justify-between gap-4 pb-1',
    headerActions: 'flex flex-col items-end gap-3',
    eventsBadge: 'gap-2 border-slate-200 px-3 py-1 font-medium text-slate-600',
    staleBadge: 'max-w-full whitespace-normal border-amber-300 text-amber-800',
    eventsDot: 'size-2 rounded-full',
    profile: 'flex items-center gap-4 text-slate-600',
    details: 'grid grid-cols-1 gap-4 xl:grid-cols-3',
    summaryCard: 'gap-0 rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    cardHeader: 'flex items-center gap-5',
    icon: 'size-6',
    smallIcon: 'size-4!',
    greenIcon: 'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800',
    orangeIcon: 'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600',
    purpleIcon: 'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600',
    summaryFooter: 'flex items-end gap-2 ',
    greenDot: 'size-2 rounded-full bg-green-700',
    grayDot: 'size-2 rounded-full bg-slate-400',
    greenText: 'font-medium text-green-700',
    orangeText: 'font-medium text-orange-600',
    resourceCard: 'rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    sectionHeader: 'flex flex-wrap items-center justify-between gap-2',
    sectionHeading: 'flex flex-wrap items-center gap-x-4 gap-y-1',
    meterSkeleton: 'h-[116px] animate-pulse rounded-xl border border-slate-100 bg-slate-100',
    connectionError: 'mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800',
    systemFooter: 'grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm ring-0 md:grid-cols-2 xl:grid-cols-3 md:divide-x md:divide-slate-100',
    typeSummary: 'flex flex-col gap-3',
    typeSummaryTitle: 'text-sm font-semibold text-slate-900',
    systemStatus: 'flex items-center gap-4 px-3',
    systemIcon: 'size-6 shrink-0 text-slate-500',
};

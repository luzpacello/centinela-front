import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Info, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useInstanceDetail } from '../../hooks/useInstanceDetail';
import type { InventoryInstance, InstancePowerAction, InstanceTransition } from '../../types/instance';
import type { InstanceDetailTab } from '../../types/instanceDetail';
import InstanceAction from '../InstanceAction';
import { InstanceStatusBadge } from '../InstanceBadges';
import GeneralDataOfInstance from './generalDataOfInstance';
import InstanceDetailFeedback from './InstanceDetailFeedback';
import InstanceIdentityCard from './InstanceIdentityCard';
import InstanceInformationRow from './InstanceInformationRow';
import InstanceResourcesPanel from './InstanceResourcesPanel';

interface InstanceDetailContentProps {
    instance: InventoryInstance;
    transition?: InstanceTransition;
    isPowerActionPending: boolean;
    onActionAccepted: (action: InstancePowerAction) => void;
    onDeleteAccepted: () => void;
}

export default function InstanceDetailContent({ instance, transition, isPowerActionPending, onActionAccepted, onDeleteAccepted }: InstanceDetailContentProps) {
    const { canOperateInstance, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<InstanceDetailTab>('resumen');
    const data = useInstanceDetail(String(instance.id), instance.status);
    const canEdit = isAdmin() || (canOperateInstance(instance.id) && instance.nivelAcceso !== 'READ_ONLY');
    const isBusy = isPowerActionPending || transition?.isTransitioning === true || instance.activeTask?.status === 'RUNNING';
    const displayedInstance = {
        ...instance,
        name: data.detail?.name ?? instance.name,
        node: data.detail?.node ?? instance.node,
        type: data.detail?.type ?? instance.type,
    };

    return <section className={styles.page}>
        <header className={styles.header}>
            <div className={styles.headingContainer}>
                <nav aria-label="Migas de pan" className={styles.breadcrumb}>
                    <Link to="/instances" className={styles.breadcrumbLink}>Instancias</Link>
                    <ChevronRight className={styles.breadcrumbIcon} aria-hidden="true" />
                    <span className={styles.currentPage}>{displayedInstance.name}</span>
                </nav>
                <div className={styles.titleRow}>
                    <h1>{displayedInstance.name}</h1>
                    <InstanceStatusBadge status={instance.status} activeTask={instance.activeTask} />
                </div>
            </div>
            <div className={styles.headerActions}>
                <InstanceAction variant="header" disabled={data.isSaving} instance={displayedInstance} transition={transition}
                    isPowerActionPending={isPowerActionPending} onActionAccepted={onActionAccepted} onDeleteAccepted={onDeleteAccepted} />
                <Button type="button" disabled={!canEdit || isBusy || !data.hasChanges || data.isSaving || !data.detail}
                    onClick={() => void data.saveChanges(canEdit && !isBusy)}>
                    {data.isSaving ? <Loader2 className={styles.loadingIcon} aria-hidden="true" /> : <Save className={styles.smallIcon} aria-hidden="true" />}
                    {data.isSaving ? 'Guardando…' : 'Guardar cambios'}
                </Button>
            </div>
        </header>

        <InstanceIdentityCard instance={displayedInstance} />

        {data.requiresReboot && <div role="status" className={styles.rebootNotice}>
            <Info className={styles.smallIcon} aria-hidden="true" />Los recursos guardados se aplicarán al reiniciar la instancia.
        </div>}
        {data.errorMessage && data.detail && <div role="alert" className={styles.refreshError}>
            <p>{data.errorMessage}</p><Button type="button" variant="outline" onClick={data.refresh}>Reintentar</Button>
        </div>}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as InstanceDetailTab)} className={styles.tabs}>
            <div className={styles.tabsScroller}>
                <TabsList variant="line" aria-label="Secciones del detalle" className={styles.tabsList}>
                    <TabsTrigger value="resumen" className={styles.tabTrigger}>Resumen</TabsTrigger>
                    <TabsTrigger value="recursos" className={styles.tabTrigger}>Recursos</TabsTrigger>
                    <TabsTrigger value="red" className={styles.tabTrigger}>Red</TabsTrigger>
                    <TabsTrigger value="snapshots" className={styles.tabTrigger}>Snapshots</TabsTrigger>
                </TabsList>
            </div>
            {!data.detail ? (data.isLoading
                ? <p role="status" aria-busy="true" className={styles.loadingDetail}>Cargando detalle de la instancia…</p>
                : <InstanceDetailFeedback title="No se pudo cargar el detalle" description={data.errorMessage || 'El detalle no está disponible.'} onRetry={data.refresh} />
            ) : <>
                <TabsContent value="resumen">
                    <GeneralDataOfInstance instance={displayedInstance} detail={data.detail} metrics={data.metrics}
                        timeframe={data.timeframe} onTimeframeChange={data.setTimeframe}
                        metricsLoading={data.metricsLoading} metricsError={data.metricsError} onRetry={data.refresh}
                        canEdit={canEdit && !isBusy && !data.isSaving} onEditResources={() => setActiveTab('recursos')} onViewNetwork={() => setActiveTab('red')} />
                </TabsContent>
                <TabsContent value="recursos">
                    <InstanceResourcesPanel />
                </TabsContent>
                <TabsContent value="red">
                    <Card className={styles.contentCard}>
                        <h2>Configuración de red</h2>
                        <dl className={styles.networkInformation}>
                            <InstanceInformationRow label="Dirección IP">{instance.ip || '—'}</InstanceInformationRow>
                            <InstanceInformationRow label="Nodo">{displayedInstance.node}</InstanceInformationRow>
                        </dl>
                    </Card>
                </TabsContent>
                <TabsContent value="snapshots">
                    <Card className={styles.contentCard}>
                        <h2>Snapshots</h2>
                        <p className="text-secundario">La consulta de snapshots todavía no está disponible.</p>
                    </Card>
                </TabsContent>
            </>}
        </Tabs>
    </section>;
}

const styles = {
    page: 'flex min-w-0 flex-col gap-5 text-slate-900',
    header: 'flex flex-col justify-between gap-5 xl:flex-row xl:items-end',
    headingContainer: 'min-w-0',
    breadcrumb: 'mb-3 flex items-center gap-1.5 text-xs text-slate-500',
    breadcrumbLink: 'hover:text-blue-600',
    breadcrumbIcon: 'size-3.5 shrink-0',
    currentPage: 'truncate font-semibold text-slate-900',
    titleRow: 'flex flex-wrap items-center gap-3',
    headerActions: 'flex flex-wrap items-center gap-3',
    smallIcon: 'size-4! shrink-0',
    loadingIcon: 'size-4! animate-spin',
    tabs: 'gap-5',
    tabsScroller: 'overflow-x-auto border-b border-slate-200 pb-1',
    tabsList: 'justify-start gap-5 px-0',
    tabTrigger: 'flex-none px-4',
    loadingDetail: 'py-12 text-center text-sm text-slate-500',
    contentCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0',
    networkInformation: 'max-w-xl',
    rebootNotice: 'flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900',
    refreshError: 'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700',
};

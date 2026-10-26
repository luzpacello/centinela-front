import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InstanceStatusBadge } from '../InstanceBadges';
import type { InstanceDetail, InstanceMetricPoint, InstanceMetricsTimeframe } from '../../types/instanceDetail';
import type { InventoryInstance } from '../../types/instance';
import InstanceInformationRow from './InstanceInformationRow';
import InstanceResourceUsage from './InstanceResourceUsage';
import InstanceNetworkCard from './InstanceNetworkCard';
import InstanceHardwareCard from './InstanceHardwareCard';

interface GeneralDataOfInstanceProps {
    instance: InventoryInstance;
    detail: InstanceDetail;
    metrics: InstanceMetricPoint[];
    timeframe: InstanceMetricsTimeframe;
    onTimeframeChange: (timeframe: InstanceMetricsTimeframe) => void;
    metricsLoading: boolean;
    metricsError: string | null;
    onRetry: () => void;
    onEditResources: () => void;
    onViewNetwork: () => void;
    canEdit: boolean;
}

export default function GeneralDataOfInstance({ instance, detail, metrics, timeframe, onTimeframeChange, metricsLoading, metricsError, onRetry, onEditResources, onViewNetwork, canEdit }: GeneralDataOfInstanceProps) {
    return <div className={styles.summaryGrid}>
        <div className={styles.mainColumn}>
            <InstanceResourceUsage detail={detail} metrics={metrics} timeframe={timeframe} onTimeframeChange={onTimeframeChange} isLoading={metricsLoading} error={metricsError} onRetry={onRetry} />
            <Card className={styles.generalInformationCard}>
                <div className={styles.sectionHeader}>
                    <h2>Información general</h2>
                    {canEdit && <Button type="button" variant="outline" onClick={onEditResources}>
                        <Pencil className={styles.editIcon} aria-hidden="true" />Editar
                    </Button>}
                </div>
                <dl className={styles.informationGrid}>
                    <div className={styles.informationColumn}>
                        <InstanceInformationRow label="Nombre">{detail.name}</InstanceInformationRow>
                        <InstanceInformationRow label="ID">{detail.reference}</InstanceInformationRow>
                        <InstanceInformationRow label="Tipo">{detail.type === 'VM' ? 'Máquina virtual (VM)' : 'Contenedor (LXC)'}</InstanceInformationRow>
                        <InstanceInformationRow label="Estado"><InstanceStatusBadge status={instance.status} /></InstanceInformationRow>
                        <InstanceInformationRow label="Nodo">{detail.node}</InstanceInformationRow>
                        <InstanceInformationRow label="Sistema operativo" />
                        <InstanceInformationRow label="Descripción" />
                    </div>
                    <div className={styles.informationColumn}>
                        <InstanceInformationRow label="Inicio automático" />
                        <InstanceInformationRow label="Tiempo encendido" />
                        <InstanceInformationRow label="Creada" />
                        <InstanceInformationRow label="Última copia de seguridad" />
                        <InstanceInformationRow label="Plantilla origen" />
                        <InstanceInformationRow label="Almacenamiento" />
                    </div>
                </dl>
            </Card>
        </div>
        <aside className={styles.sidebarColumn}>
            <InstanceNetworkCard ip={instance.ip} onViewNetwork={onViewNetwork} />
            <InstanceHardwareCard detail={detail} />
        </aside>
    </div>;
}

const styles = {
    summaryGrid: 'grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]',
    mainColumn: 'grid min-w-0 gap-5',
    sidebarColumn: 'grid min-w-0 gap-4',
    generalInformationCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0',
    sectionHeader: 'flex items-center justify-between gap-4',
    editIcon: 'size-4!',
    informationGrid: 'grid grid-cols-1 gap-5 divide-slate-100 lg:grid-cols-2 lg:divide-x',
    informationColumn: 'min-w-0 last:lg:pl-5',
};

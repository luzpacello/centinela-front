import { Container, Monitor } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InstanceTypeBadge } from '../InstanceBadges';
import type { InventoryInstance } from '../../types/instance';

export default function InstanceIdentityCard({ instance }: { instance: InventoryInstance }) {
    const TypeIcon = instance.type === 'VM' ? Monitor : Container;
    return <Card className={styles.identityCard}>
        <div className={styles.identityHeading}>
            <span className={styles.instanceIconContainer}><TypeIcon className={styles.instanceIcon} aria-hidden="true" /></span>
            <InstanceTypeBadge type={instance.type} />
            <span className={styles.reference} title={String(instance.id)}>ID: {instance.id}</span>
        </div>
        <Separator orientation="vertical" className={styles.identitySeparator} />
        <div className={styles.identityField}><span className={styles.fieldLabel}>Nodo</span><strong className={styles.fieldValue}>{instance.node}</strong></div>
        <Separator orientation="vertical" className={styles.identitySeparator} />
        <div className={styles.identityField}><span className={styles.fieldLabel}>Sistema operativo</span><strong className={styles.fieldValue}>—</strong></div>
        <Separator orientation="vertical" className={styles.identitySeparator} />
        <div className={styles.identityField}><span className={styles.fieldLabel}>Tiempo encendido</span><strong className={styles.fieldValue}>—</strong></div>
        <Separator orientation="vertical" className={styles.identitySeparator} />
        <div className={styles.identityField}><span className={styles.fieldLabel}>Dirección IP</span><strong className={styles.fieldValue}>{instance.ip || '—'}</strong></div>
    </Card>;
}

const styles = {
    identityCard: 'flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm ring-0 xl:flex-row xl:items-center xl:gap-5',
    identityHeading: 'flex min-w-0 flex-1 flex-wrap items-center gap-3',
    instanceIconContainer: 'flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600',
    instanceIcon: 'size-7',
    reference: 'min-w-0 max-w-full truncate text-xs font-medium text-slate-950',
    identitySeparator: 'hidden h-12 bg-slate-100 xl:block',
    identityField: 'grid min-w-0 gap-1 xl:max-w-52 xl:flex-1',
    fieldLabel: 'text-xs text-slate-500',
    fieldValue: 'break-words text-sm font-medium text-slate-950',
};

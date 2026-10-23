import { Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { InstanceConfigEditor } from '../../hooks/useEditInstanceConfig';
import type { InstanceResourceConfiguration } from '../../types/instanceDetail';
import type { InstanceResourceValues } from '../../validation/editInstanceConfigValidation';
import InstanceResourceFields from '../InstanceResourceFields';

interface InstanceResourcesPanelProps {
    values: InstanceResourceValues;
    current: InstanceResourceValues;
    editor: InstanceConfigEditor;
    status: string;
    canEdit: boolean;
    isSaving: boolean;
    onChange: (field: keyof InstanceResourceConfiguration, value: number) => void;
    onEditResources: () => void;
}

export default function InstanceResourcesPanel({ values, current, editor, status, canEdit, isSaving, onChange, onEditResources }: InstanceResourcesPanelProps) {
    const node = editor.nodeStatus;
    const resources = [
        { label: 'CPU', value: node?.cpu ? `${node.cpu.usagePercent}% de uso` : '—', percentage: node?.cpu?.usagePercent },
        { label: 'Memoria RAM', value: node?.ram ? `${node.ram.usedGb} / ${node.ram.totalGb} GB` : '—', percentage: node?.ram?.usagePercent },
        { label: 'Almacenamiento', value: node?.storage ? `${node.storage.usedGb} / ${node.storage.totalGb} GB` : '—', percentage: node?.storage?.usagePercent },
    ];
    return <div className={styles.pageContent}>
        <Card className={styles.availableResourcesCard}>
            <div className={styles.availableResourcesHeader}>
                <span className={styles.availableResourcesIconContainer}><Server className={styles.availableResourcesIcon} aria-hidden="true" /></span>
                <div>
                    <h2 className={styles.availableResourcesTitle}>Recursos disponibles en el nodo de destino</h2>
                    <p className={styles.availableResourcesDescription}>Recursos actuales del host de la instancia.</p>
                </div>
            </div>
            <div className={styles.availableResourcesGrid}>
                {resources.map((resource) => <div key={resource.label} className={styles.availabilityMetric}>
                    <strong className={styles.availabilityMetricHeader}>{resource.label}</strong>
                    <span className={styles.availabilityMetricValue}>{resource.value}</span>
                    {resource.percentage !== undefined && <div className={styles.progressTrack} role="progressbar" aria-label={`Uso de ${resource.label}`}
                        aria-valuemin={0} aria-valuemax={100} aria-valuenow={resource.percentage}>
                        <div className={styles.availabilityProgressValue} style={{ width: `${Math.min(100, Math.max(0, resource.percentage))}%` }} />
                    </div>}
                </div>)}
            </div>
        </Card>
        <Card className={styles.instanceResourcesCard}>
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div className={styles.contentHeader}>
                    <h2 className={styles.pageTitle}>Recursos de la instancia</h2>
                    <p className={styles.pageDescription}>Define los recursos de CPU y memoria para la instancia.</p>
                </div>
                {canEdit && <Button type="button" variant="outline" disabled={isSaving} onClick={onEditResources}>Editar recursos</Button>}
            </header>
            <InstanceResourceFields values={values} current={current} editor={editor} status={status} disabled={!canEdit || isSaving} onChange={onChange} />
        </Card>
    </div>;
}

const styles = {
    pageContent: 'grid gap-5',
    contentHeader: 'min-w-0',
    pageTitle: 'mb-1 text-lg font-semibold text-slate-950',
    pageDescription: 'text-sm text-slate-500',
    availableResourcesCard: 'gap-5 rounded-xl border border-blue-200 bg-blue-50/40 p-5 shadow-none ring-0',
    availableResourcesHeader: 'flex items-start gap-3',
    availableResourcesIconContainer: 'flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-950',
    availableResourcesIcon: 'size-5',
    availableResourcesTitle: 'text-sm font-semibold text-blue-950',
    availableResourcesDescription: 'mt-1 text-xs text-slate-600',
    availableResourcesGrid: 'grid grid-cols-1 gap-5 md:grid-cols-3',
    availabilityMetric: 'min-w-0 border-l border-blue-200 pl-4 first:border-l-0 first:pl-0',
    availabilityMetricHeader: 'flex items-center justify-between gap-3 text-xs text-blue-950',
    availabilityMetricValue: 'mt-1 block text-xs text-slate-600',
    progressTrack: 'mt-2 h-2 overflow-hidden rounded-full bg-slate-200',
    availabilityProgressValue: 'h-full rounded-full bg-blue-800',
    instanceResourcesCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-none ring-0',
    resourceManagersGrid: 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4',
    resourceManagerCard: 'min-w-0 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-none ring-0',
    resourceManagerHeader: 'flex min-h-16 items-start gap-3',
    resourceManagerIconContainer: 'flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-950',
    resourceManagerIcon: 'size-5',
    resourceManagerTitle: 'mb-1 text-sm font-semibold text-slate-950',
    resourceManagerDescription: 'text-xs leading-5 text-slate-500',
    numericControlContainer: 'grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem_auto] items-center',
    numericControlButton: 'rounded-none first:rounded-l-lg last-of-type:rounded-r-lg',
    numericControlIcon: 'size-4!',
    numericControlInput: 'rounded-none border-x-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
    numericControlUnit: 'pl-2 text-xs font-medium text-slate-900',
    resourceHelperText: 'mt-1 text-xs text-slate-500',
    storageAvailabilityRow: 'flex items-center justify-between gap-3 text-[11px] text-slate-500',
    storageProgressValue: 'h-full rounded-full bg-blue-800',
    resourceValidationPanel: 'flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 text-emerald-900',
    validationIconContainer: 'flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700',
    validationIcon: 'size-5',
    validationTextContainer: 'flex flex-col gap-1 text-xs',
    validationTitle: 'text-sm font-semibold',
};

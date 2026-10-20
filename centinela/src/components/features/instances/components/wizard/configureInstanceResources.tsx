import {
    Info,
    Cpu,
    Database,
    HardDrive,
    MemoryStick,
    Minus,
    Plus,
    Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import {
    RESOURCE_LIMITS,
} from '@/components/features/instances/data/createInstanceOptions';
import type { NodeStatusResponse } from '@/components/features/dashboard/services/nodeStatusService';
import type {
    CreateInstanceDraft,
    StorageOption,
    UpdateCreateInstanceField,
} from '@/components/features/instances/types/createInstance';
import { assessResourceQuota } from '@/components/features/instances/validation/createInstanceValidation';

interface ConfigureInstanceResourcesProps {
    draft: CreateInstanceDraft;
    storages: StorageOption[];
    isLoadingCatalog: boolean;
    catalogError: string | null;
    nodeStatus: NodeStatusResponse | null;
    nodeStatusError: string | null;
    isLoadingNodeStatus: boolean;
    onFieldChange: UpdateCreateInstanceField;
}

type NumericResourceField = 'cores' | 'ramMb' | 'discoGb';

export default function ConfigureInstanceResources({
    draft,
    storages,
    isLoadingCatalog,
    catalogError,
    nodeStatus,
    nodeStatusError,
    isLoadingNodeStatus,
    onFieldChange,
}: ConfigureInstanceResourcesProps) {
    const selectedStorage = storages.find((storage) => storage.value === draft.storageId);
    const storagePercentage = selectedStorage && selectedStorage.totalGb > 0
        ? Math.round((selectedStorage.availableGb / selectedStorage.totalGb) * 100)
        : 0;
    const quotaAssessment = assessResourceQuota(draft, nodeStatus, nodeStatusError, isLoadingNodeStatus);
    const allocatable = nodeStatus?.stale ? null : nodeStatus?.allocatable;
    const quotaMetrics = [
        {
            label: 'vCPU',
            percentage: quotaAssessment.percentages.cores,
            requested: `${draft.cores ?? 0} de ${allocatable?.maxCpuCores ?? '—'} núcleos asignables`,
        },
        {
            label: 'Memoria RAM',
            percentage: quotaAssessment.percentages.ram,
            requested: `${((draft.ramMb ?? 0) / 1024).toFixed(2)} GB de ${allocatable ? (allocatable.freeRamMb / 1024).toFixed(2) : '—'} GB asignables`,
            projected: allocatable && nodeStatus ? `Uso previsto del host: ${(nodeStatus.ram.usedGb + (draft.ramMb ?? 0) / 1024).toFixed(2)} / ${nodeStatus.ram.totalGb} GB` : null,
        },
        {
            label: 'Disco',
            percentage: quotaAssessment.percentages.disk,
            requested: `${draft.discoGb ?? 0} GB de ${allocatable?.freeStorageGb ?? '—'} GB asignables`,
            projected: allocatable && nodeStatus ? `Uso previsto del host: ${(nodeStatus.storage.usedGb + (draft.discoGb ?? 0)).toFixed(2)} / ${nodeStatus.storage.totalGb} GB` : null,
        },
    ];

    function adjustResource(field: NumericResourceField, direction: -1 | 1) {
        const limits = RESOURCE_LIMITS[field];
        const currentValue = draft[field] ?? limits.min;
        const nextValue = Math.max(limits.min, currentValue + direction * limits.step);
        const availableMaximum = field === 'cores'
            ? allocatable?.maxCpuCores ?? null
            : field === 'ramMb'
                ? allocatable?.freeRamMb ?? null
                : Math.min(allocatable?.freeStorageGb ?? Infinity, selectedStorage?.availableGb ?? Infinity);
        if (direction === 1 && availableMaximum !== null && nextValue > availableMaximum) return;
        onFieldChange(field, nextValue);
    }

    return (
        <div className={styles.pageContent}>
            <Card className={styles.availableResourcesCard}>
                <div className={styles.availableResourcesHeader}>
                    <span className={styles.availableResourcesIconContainer}>
                        <Server className={styles.availableResourcesIcon} aria-hidden="true" />
                    </span>
                    <div>
                        <h3 className={styles.availableResourcesTitle}>Estado del nodo de destino</h3>
                        <p className={styles.availableResourcesDescription}>
                            {nodeStatusError ? 'No se pudo cargar el estado del nodo.' : isLoadingNodeStatus ? 'Cargando estado del nodo…' : nodeStatus?.stale ? 'Última lectura disponible del nodo configurado en el servidor.' : 'Recursos actuales del nodo configurado en el servidor.'}
                        </p>
                    </div>
                </div>

                <div className={styles.availableResourcesGrid}>
                    <AvailabilityMetric
                        label="CPU"
                        value={nodeStatus ? `${nodeStatus.cpu.cores} vCPU totales` : '—'}
                        percentage={nodeStatus?.cpu.usagePercent ?? null}
                    />
                    <AvailabilityMetric
                        label="Memoria"
                        value={nodeStatus ? `${nodeStatus.ram.usedGb} / ${nodeStatus.ram.totalGb} GB` : '—'}
                        percentage={nodeStatus?.ram.usagePercent ?? null}
                    />
                    <AvailabilityMetric
                        label="Disco del nodo"
                        value={nodeStatus ? `${nodeStatus.storage.usedGb} / ${nodeStatus.storage.totalGb} GB` : '—'}
                        percentage={nodeStatus?.storage.usagePercent ?? null}
                    />
                </div>
            </Card>

            <Card className={styles.instanceResourcesCard}>
                <header className={styles.contentHeader}>
                    <h2 className={styles.pageTitle}>Recursos de la instancia</h2>
                    <p className={styles.pageDescription}>Define los recursos de CPU, memoria y disco para la instancia.</p>
                </header>

                <div className={styles.resourceManagersGrid}>
                    <ResourceManagerCard
                        icon={Cpu}
                        title="CPU"
                        description="Cantidad de núcleos virtuales para la instancia."
                        value={draft.cores}
                        unit="vCPU"
                        min={RESOURCE_LIMITS.cores.min}
                        step={RESOURCE_LIMITS.cores.step}
                        sliderMax={Math.max(RESOURCE_LIMITS.cores.min * 2, (allocatable?.maxCpuCores ?? 0) * 2, draft.cores ?? 0)}
                        isOverQuota={(quotaAssessment.percentages.cores ?? 0) > 100}
                        helperText={`Cuota del nodo: ${allocatable?.maxCpuCores ?? '—'} vCPU`}
                        onDecrease={() => adjustResource('cores', -1)}
                        onIncrease={() => adjustResource('cores', 1)}
                        onValueChange={(value) => onFieldChange('cores', value)}
                    />
                    <ResourceManagerCard
                        icon={MemoryStick}
                        title="Memoria RAM"
                        description="Memoria asignada para la instancia."
                        value={draft.ramMb == null ? null : draft.ramMb / 1024}
                        unit="GB"
                        min={RESOURCE_LIMITS.ramMb.min / 1024}
                        step={RESOURCE_LIMITS.ramMb.step / 1024}
                        sliderMax={Math.max(RESOURCE_LIMITS.ramMb.min * 2, (allocatable?.freeRamMb ?? 0) * 2, draft.ramMb ?? 0) / 1024}
                        isOverQuota={(quotaAssessment.percentages.ram ?? 0) > 100}
                        helperText={`RAM asignable segura: ${allocatable ? `${(allocatable.freeRamMb / 1024).toFixed(2)} GB` : '—'}`}
                        onDecrease={() => adjustResource('ramMb', -1)}
                        onIncrease={() => adjustResource('ramMb', 1)}
                        onValueChange={(value) => onFieldChange('ramMb', value == null ? null : Math.round(value * 1024))}
                    />
                    <ResourceManagerCard
                        icon={Database}
                        title="Disco principal"
                        description="Tamaño del disco del sistema de la instancia."
                        value={draft.discoGb}
                        unit="GB"
                        min={RESOURCE_LIMITS.discoGb.min}
                        step={RESOURCE_LIMITS.discoGb.step}
                        sliderMax={Math.max(RESOURCE_LIMITS.discoGb.min * 2, (allocatable?.freeStorageGb ?? 0) * 2, draft.discoGb ?? 0)}
                        isOverQuota={(quotaAssessment.percentages.disk ?? 0) > 100}
                        helperText={`Tamaño mínimo: ${RESOURCE_LIMITS.discoGb.min} GB`}
                        onDecrease={() => adjustResource('discoGb', -1)}
                        onIncrease={() => adjustResource('discoGb', 1)}
                        onValueChange={(value) => onFieldChange('discoGb', value)}
                    />

                    <Card className={styles.resourceManagerCard}>
                        <div className={styles.resourceManagerHeader}>
                            <span className={styles.resourceManagerIconContainer}>
                                <HardDrive className={styles.resourceManagerIcon} aria-hidden="true" />
                            </span>
                            <div>
                                <h3 className={styles.resourceManagerTitle}>Almacenamiento de destino</h3>
                                <p className={styles.resourceManagerDescription}>Selecciona dónde se creará el disco.</p>
                            </div>
                        </div>
                        <Combobox
                            value={draft.storageId || null}
                            onValueChange={(value) => onFieldChange('storageId', value ?? '')}
                        >
                            <ComboboxInput aria-label="Almacenamiento de destino" placeholder="Seleccionar almacenamiento" />
                            <ComboboxContent>
                                <ComboboxList>
                                    {storages.map((storage) => (
                                        <ComboboxItem key={storage.value} value={storage.value}>{storage.label}</ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        <div className={styles.storageAvailabilityRow}>
                            <span>{catalogError || (isLoadingCatalog ? 'Cargando almacenamientos…' : selectedStorage ? `Disponibles: ${selectedStorage.availableLabel} de ${selectedStorage.totalLabel}` : 'Disponibles: —')}</span>
                            <strong>{selectedStorage ? `${storagePercentage}%` : '—'}</strong>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.storageProgressValue} style={{ width: `${storagePercentage}%` }} />
                        </div>
                    </Card>
                </div>

                <div className={styles.resourceValidationPanel}>
                    <span className={styles.validationIconContainer}>
                        <Info className={styles.validationIcon} aria-hidden="true" />
                    </span>
                    <div className={styles.validationTextContainer}>
                        <strong className={styles.validationTitle}>Verificación de recursos</strong>
                        <Badge variant={quotaAssessment.level === 'destructive' ? 'destructive' : quotaAssessment.level === 'warning' ? 'warning' : quotaAssessment.level === 'normal' ? 'success' : 'secondary'}>
                            {quotaAssessment.level === 'normal' ? 'Dentro de cuota' : quotaAssessment.level === 'warning' ? 'Cerca del límite' : quotaAssessment.level === 'destructive' ? 'Cuota insuficiente' : 'Cuota no disponible'}
                        </Badge>
                        {quotaAssessment.message && <span role="status">{quotaAssessment.message}</span>}
                        <span>El servidor comprobará la disponibilidad final al crear la instancia.</span>
                    </div>
                    <div className={styles.resourceSummary}>
                        <strong>Resumen de recursos</strong>
                        <span>
                            CPU: {draft.cores ?? '—'} vCPU · RAM: {draft.ramMb == null ? '—' : `${draft.ramMb / 1024} GB`} · Disco: {draft.discoGb == null ? '—' : `${draft.discoGb} GB`}
                        </span>
                    </div>
                    <div className={styles.quotaMetrics} aria-label="Capacidad solicitada del nodo">
                        {quotaMetrics.map((metric) => (
                            <div key={metric.label} className={styles.quotaMetric}>
                                <div className={styles.quotaMetricHeader}>
                                    <strong>{metric.label}</strong>
                                    <span>{metric.percentage === null ? '—' : Number.isFinite(metric.percentage) ? `${Math.round(metric.percentage)} %` : '>100 %'}</span>
                                </div>
                                <span>{metric.requested}</span>
                                {metric.projected && <span>{metric.projected}</span>}
                                {metric.percentage !== null && (
                                    <div
                                        role="progressbar"
                                        aria-label={`Cuota de ${metric.label}`}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={Math.min(100, Math.max(0, Math.round(metric.percentage)))}
                                        aria-valuetext={Number.isFinite(metric.percentage) ? `${Math.round(metric.percentage)} % de la cuota asignable` : 'Más del 100 % de la cuota asignable'}
                                        className={styles.progressTrack}
                                    >
                                        <div
                                            className={`${styles.quotaProgressValue} ${metric.percentage > 100 ? 'bg-destructive' : metric.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                                            style={{ width: `${Math.min(100, Math.max(0, metric.percentage))}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}

function AvailabilityMetric({
    label,
    value,
    percentage,
}: {
    label: string;
    value: string;
    percentage: number | null;
}) {
    return (
        <div className={styles.availabilityMetric}>
            <div className={styles.availabilityMetricHeader}>
                <strong>{label}</strong>
                <span>{percentage == null ? '—' : `${percentage}%`}</span>
            </div>
            <span className={styles.availabilityMetricValue}>{value}</span>
            <div className={styles.progressTrack}>
                <div className={styles.availabilityProgressValue} style={{ width: `${percentage ?? 0}%` }} />
            </div>
        </div>
    );
}

interface ResourceManagerCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    value: number | null;
    unit: string;
    min: number;
    step: number;
    sliderMax: number;
    isOverQuota: boolean;
    helperText: string;
    onDecrease: () => void;
    onIncrease: () => void;
    onValueChange: (value: number | null) => void;
}

function ResourceManagerCard({
    icon: Icon,
    title,
    description,
    value,
    unit,
    min,
    step,
    sliderMax,
    isOverQuota,
    helperText,
    onDecrease,
    onIncrease,
    onValueChange,
}: ResourceManagerCardProps) {
    return (
        <Card className={styles.resourceManagerCard}>
            <div className={styles.resourceManagerHeader}>
                <span className={styles.resourceManagerIconContainer}>
                    <Icon className={styles.resourceManagerIcon} aria-hidden="true" />
                </span>
                <div>
                    <h3 className={styles.resourceManagerTitle}>{title}</h3>
                    <p className={styles.resourceManagerDescription}>{description}</p>
                </div>
            </div>
            <div className={styles.numericControlContainer}>
                <Button type="button" variant="outline" size="icon" className={styles.numericControlButton} onClick={onDecrease} aria-label={`Disminuir ${title}`}>
                    <Minus className={styles.numericControlIcon} aria-hidden="true" />
                </Button>
                <Input
                    type="number"
                    min={min}
                    step={step}
                    value={value ?? ''}
                    aria-label={title}
                    aria-invalid={isOverQuota}
                    onChange={(event) => onValueChange(event.target.value === '' ? null : Number(event.target.value))}
                    className={styles.numericControlInput}
                />
                <Button type="button" variant="outline" size="icon" className={styles.numericControlButton} onClick={onIncrease} aria-label={`Aumentar ${title}`}>
                    <Plus className={styles.numericControlIcon} aria-hidden="true" />
                </Button>
                <span className={styles.numericControlUnit}>{unit}</span>
            </div>
            <Input
                type="range"
                min={min}
                max={sliderMax}
                step={step}
                value={value ?? min}
                aria-label={`Ajustar ${title}`}
                onChange={(event) => onValueChange(Number(event.target.value))}
                className={styles.resourceSlider}
            />
            <p className={styles.resourceHelperText}>{helperText}</p>
        </Card>
    );
}

const styles = {
    pageContent: 'grid gap-5 ',
    contentHeader: 'min-w-0',
    pageTitle: 'mb-1 text-lg font-semibold text-slate-950',
    pageDescription: 'text-sm text-slate-500',
    availableResourcesCard: 'gap-5 rounded-xl border border-blue-200 bg-blue-50/40 p-5 shadow-none ring-0',
    availableResourcesHeader: 'flex items-start gap-3',
    availableResourcesIconContainer: 'flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-950',
    availableResourcesIcon: 'size-5',
    availableResourcesTitle: 'text-blue-950',
    availableResourcesDescription: 'text-xs text-slate-600',
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
    numericControlInput: 'rounded-none border-x-0 text-center',
    numericControlUnit: 'pl-2 text-xs font-medium text-slate-900',
    resourceHelperText: 'text-xs text-slate-500',
    storageAvailabilityRow: 'flex items-center justify-between gap-3 text-[11px] text-slate-500',
    storageProgressValue: 'h-full rounded-full bg-blue-800',
    resourceValidationPanel: 'grid gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-5 text-blue-950 md:grid-cols-[auto_minmax(0,1fr)]',
    validationIconContainer: 'flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white',
    validationIcon: 'size-5',
    validationTextContainer: 'flex flex-1 flex-col gap-1',
    validationTitle: 'text-sm font-semibold',

    resourceSummary: 'flex flex-col gap-1 text-xs md:col-start-2',
    resourceSlider: 'h-2 cursor-pointer border-0 bg-transparent p-0 accent-blue-600',
    quotaMetrics: 'grid gap-4 md:col-start-2 md:grid-cols-3',
    quotaMetric: 'flex min-w-0 flex-col gap-1 text-xs',
    quotaMetricHeader: 'flex items-center justify-between gap-2',
    quotaProgressValue: 'h-full rounded-full transition-[width] duration-200',
};

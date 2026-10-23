import type { ComponentType } from 'react';
import {
    CircleCheck,
    Cpu,
    Database,
    HardDrive,
    MemoryStick,
    Minus,
    Plus,
    Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';

const availableNodeResources = [
    { label: 'CPU', value: '4.4 / 20 vCPU', percentage: 22 },
    { label: 'Memoria RAM', value: '28.6 / 64 GB', percentage: 45 },
    { label: 'Almacenamiento', value: '1.22 / 2.00 TB', percentage: 61 },
];

const destinationStorageOptions = [
    { value: 'local-lvm', label: 'local-lvm (LVM-Thin)' },
    { value: 'local', label: 'local (Directory)' },
];

export default function InstanceResourcesPanel() {
    return (
        <div className={styles.pageContent}>
            <Card className={styles.availableResourcesCard}>
                <div className={styles.availableResourcesHeader}>
                    <span className={styles.availableResourcesIconContainer}>
                        <Server className={styles.availableResourcesIcon} aria-hidden="true" />
                    </span>
                    <div>
                        <h2 className={styles.availableResourcesTitle}>Recursos disponibles en el nodo de destino</h2>
                        <p className={styles.availableResourcesDescription}>Resumen de los recursos actuales del nodo pve01.</p>
                    </div>
                </div>

                <div className={styles.availableResourcesGrid}>
                    {availableNodeResources.map((resource) => (
                        <AvailabilityMetric key={resource.label} {...resource} />
                    ))}
                </div>
            </Card>

            <Card className={styles.instanceResourcesCard}>
                <header className={styles.contentHeader}>
                    <h2 className={styles.pageTitle}>Recursos de la instancia</h2>
                    <p className={styles.pageDescription}>Define los recursos de CPU, memoria y disco para la instancia.</p>
                </header>

                <div className={styles.resourceManagersGrid}>
                    <StaticResourceManagerCard
                        inputId="instance-detail-cpu"
                        icon={Cpu}
                        title="CPU"
                        description="Cantidad de núcleos virtuales para la instancia."
                        defaultValue={2}
                        unit="vCPU"
                        min={1}
                        step={1}
                        helperText="Disponibles: 8 vCPU"
                    />
                    <StaticResourceManagerCard
                        inputId="instance-detail-memory"
                        icon={MemoryStick}
                        title="Memoria RAM"
                        description="Memoria asignada para la instancia."
                        defaultValue={4}
                        unit="GB"
                        min={1}
                        step={1}
                        helperText="Disponibles: 28.6 GB"
                    />

                    <Card className={styles.resourceManagerCard}>
                        <ResourceManagerHeader
                            icon={HardDrive}
                            title="Almacenamiento de destino"
                            description="Seleccioná el almacenamiento donde se encuentra el disco."
                        />
                        <Combobox defaultValue="local-lvm">
                            <ComboboxInput aria-label="Almacenamiento de destino" />
                            <ComboboxContent>
                                <ComboboxList>
                                    {destinationStorageOptions.map((storage) => (
                                        <ComboboxItem key={storage.value} value={storage.value}>{storage.label}</ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                        <div className={styles.storageAvailabilityRow}>
                            <span>Disponible: 722.5 GB de 1.85 TB</span>
                            <strong>39%</strong>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.storageProgressValue} style={{ width: '39%' }} />
                        </div>
                    </Card>

                    <StaticResourceManagerCard
                        inputId="instance-detail-disk"
                        icon={Database}
                        title="Disco principal"
                        description="Tamaño del disco del sistema de la instancia."
                        defaultValue={32}
                        unit="GB"
                        min={20}
                        step={1}
                        helperText="Tamaño mínimo: 20 GB"
                    />
                </div>
            </Card>

            <div className={styles.resourceValidationPanel} role="status">
                <span className={styles.validationIconContainer}>
                    <CircleCheck className={styles.validationIcon} aria-hidden="true" />
                </span>
                <div className={styles.validationTextContainer}>
                    <strong className={styles.validationTitle}>Validación de recursos</strong>
                    <span>Los recursos seleccionados son suficientes para aplicar los cambios.</span>
                </div>
            </div>
        </div>
    );
}

interface AvailabilityMetricProps {
    label: string;
    value: string;
    percentage: number;
}

function AvailabilityMetric({ label, value, percentage }: AvailabilityMetricProps) {
    return (
        <div className={styles.availabilityMetric}>
            <div className={styles.availabilityMetricHeader}>
                <strong>{label}</strong>
                <span>{percentage}%</span>
            </div>
            <span className={styles.availabilityMetricValue}>{value}</span>
            <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label={`Uso de ${label}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}
            >
                <div className={styles.availabilityProgressValue} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

interface ResourceManagerHeaderProps {
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
}

function ResourceManagerHeader({ icon: Icon, title, description }: ResourceManagerHeaderProps) {
    return (
        <div className={styles.resourceManagerHeader}>
            <span className={styles.resourceManagerIconContainer}>
                <Icon className={styles.resourceManagerIcon} aria-hidden="true" />
            </span>
            <div>
                <h3 className={styles.resourceManagerTitle}>{title}</h3>
                <p className={styles.resourceManagerDescription}>{description}</p>
            </div>
        </div>
    );
}

interface StaticResourceManagerCardProps extends ResourceManagerHeaderProps {
    inputId: string;
    defaultValue: number;
    unit: string;
    min: number;
    step: number;
    helperText: string;
}

function StaticResourceManagerCard({
    inputId,
    icon,
    title,
    description,
    defaultValue,
    unit,
    min,
    step,
    helperText,
}: StaticResourceManagerCardProps) {
    return (
        <Card className={styles.resourceManagerCard}>
            <ResourceManagerHeader icon={icon} title={title} description={description} />
            <div className={styles.numericControlContainer}>
                <Button type="button" variant="outline" size="icon" className={styles.numericControlButton} aria-label={`Disminuir ${title}`}>
                    <Minus className={styles.numericControlIcon} aria-hidden="true" />
                </Button>
                <Input
                    id={inputId}
                    type="number"
                    min={min}
                    step={step}
                    defaultValue={defaultValue}
                    aria-label={title}
                    className={styles.numericControlInput}
                />
                <Button type="button" variant="outline" size="icon" className={styles.numericControlButton} aria-label={`Aumentar ${title}`}>
                    <Plus className={styles.numericControlIcon} aria-hidden="true" />
                </Button>
                <span className={styles.numericControlUnit}>{unit}</span>
            </div>
            <p className={styles.resourceHelperText}>{helperText}</p>
        </Card>
    );
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

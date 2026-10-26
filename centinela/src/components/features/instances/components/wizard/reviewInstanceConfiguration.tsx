import {
    Cpu,
    FileText,
    HardDrive,
    Loader2,
    Network,
    Pencil,
    Play,
    TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    INSTANCE_TYPE_OPTIONS,
} from '@/components/features/instances/data/createInstanceOptions';
import type { CreateInstanceDraft, OperatingSystemTemplateOption, StorageOption } from '@/components/features/instances/types/createInstance';

interface ReviewInstanceConfigurationProps {
    draft: CreateInstanceDraft;
    storages: StorageOption[];
    templates: OperatingSystemTemplateOption[];
    isCreating: boolean;
    canCreateInstance: boolean;
    hasConfirmedConfiguration: boolean;
    onConfirmationChange: (confirmed: boolean) => void;
    onEditStep: (step: number) => void;
    onCreateInstance: () => void;
}

export default function ReviewInstanceConfiguration({
    draft,
    storages,
    templates,
    isCreating,
    canCreateInstance,
    hasConfirmedConfiguration,
    onConfirmationChange,
    onEditStep,
    onCreateInstance,
}: ReviewInstanceConfigurationProps) {
    const instanceTypeLabel = INSTANCE_TYPE_OPTIONS.find((option) => option.type === draft.tipo)?.title;
    const selectedStorage = storages.find((storage) => storage.value === draft.storageId);
    const selectedTemplate = templates.find((template) => template.value === draft.templateOso);
    const networkModeLabel = draft.red.modo === 'static' ? 'IP estática' : 'DHCP';

    return (
        <Card className={styles.configurationReviewCard}>
            <header>
                <h2 className={styles.reviewTitle}>Resumen de la configuración</h2>
                <p className="text-secundario">Revisa todos los detalles de la instancia antes de crearla.</p>
            </header>

            <div className={styles.configurationSectionsGrid}>
                <ConfigurationSection
                    icon={FileText}
                    title="General"
                    onEdit={() => onEditStep(1)}
                    isDisabled={isCreating}
                >
                    <ConfigurationValue label="Tipo de instancia" value={instanceTypeLabel} />
                    <ConfigurationValue label="Nombre" value={draft.nombre} />
                    <ConfigurationValue label="Descripción" value={draft.descripcion} />
                </ConfigurationSection>

                <ConfigurationSection
                    icon={Cpu}
                    title="Hardware"
                    onEdit={() => onEditStep(2)}
                    isDisabled={isCreating}
                >
                    <ConfigurationValue label="vCPU" value={draft.cores == null ? undefined : `${draft.cores} vCPU`} />
                    <ConfigurationValue label="Memoria RAM" value={formatMemory(draft.ramMb)} />
                    <ConfigurationValue label="Tamaño de disco" value={draft.discoGb == null ? undefined : `${draft.discoGb} GB`} />
                </ConfigurationSection>

                <ConfigurationSection
                    icon={HardDrive}
                    title="Almacenamiento e imagen"
                    onEdit={() => onEditStep(2)}
                    isDisabled={isCreating}
                >
                    <ConfigurationValue label="Almacenamiento" value={draft.storageId} />
                    <ConfigurationValue label="Espacio disponible" value={selectedStorage?.availableLabel} />
                    <ConfigurationValue label="Tipo de imagen" value={selectedTemplate?.type === 'ISO' ? 'ISO' : selectedTemplate?.type === 'LXC_TEMPLATE' ? 'Template LXC' : undefined} />
                    <ConfigurationValue label="Imagen" value={selectedTemplate?.label} />
                    <ConfigurationValue label="Tamaño de imagen" value={selectedTemplate?.size} />
                </ConfigurationSection>

                <ConfigurationSection
                    icon={Network}
                    title="Red"
                    onEdit={() => onEditStep(3)}
                    isDisabled={isCreating}
                >
                    <ConfigurationValue label="Modo de configuración" value={networkModeLabel} />
                    <ConfigurationValue
                        label="Dirección IP"
                        value={draft.red.modo === 'static' ? `${draft.red.ip}/${draft.red.mascara}` : 'Asignación automática'}
                    />
                    {draft.red.modo === 'static' && <ConfigurationValue label="Puerta de enlace" value={draft.red.gateway} />}
                </ConfigurationSection>

                <Card className={styles.creationActionCard}>
                    <div>
                        <h3 className={styles.creationActionTitle}>¿Todo listo para crear la instancia?</h3>
                        <p className={styles.creationActionDescription}>La creación iniciará una tarea en segundo plano en Proxmox. Podrá seguir el progreso desde el inventario.</p>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-700">
                        <Checkbox id="confirm-instance-configuration" checked={hasConfirmedConfiguration} disabled={isCreating} onCheckedChange={(checked) => onConfirmationChange(checked)} />
                        <label htmlFor="confirm-instance-configuration">Confirmo la configuración de la instancia.</label>
                    </div>
                    <Button
                        type="button"
                        disabled={!canCreateInstance}
                        className={styles.createInstanceButton}
                        onClick={onCreateInstance}
                    >
                        {isCreating
                            ? <Loader2 className={styles.loadingIcon} aria-hidden="true" />
                            : <Play className={styles.buttonIcon} aria-hidden="true" />}
                        {isCreating ? 'Creando instancia...' : 'Crear Instancia'}
                    </Button>
                </Card>
            </div>

            <div className={styles.considerationsNotice}>
                <TriangleAlert className={styles.considerationsIcon} aria-hidden="true" />
                <div>
                    <h3 className={styles.considerationsTitle}>Puntos a tener en cuenta</h3>
                    <ul className={styles.considerationsList}>
                        <li>Se creará una nueva instancia con la configuración especificada.</li>
                        <li>El proceso puede tardar varios minutos.</li>
                        <li>Podrás ver el estado de la creación en la lista de instancias.</li>
                    </ul>
                </div>
            </div>
        </Card>
    );
}

interface ConfigurationSectionProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    children: React.ReactNode;
    onEdit: () => void;
    isDisabled: boolean;
}

function ConfigurationSection({
    icon: Icon,
    title,
    children,
    onEdit,
    isDisabled,
}: ConfigurationSectionProps) {
    return (
        <Card className={styles.configurationSectionCard}>
            <div className={styles.configurationSectionHeader}>
                <span className={styles.configurationSectionTitleContainer}>
                    <Icon className={styles.configurationSectionIcon} aria-hidden="true" />
                    <h3 className={styles.configurationSectionTitle}>{title}</h3>
                </span>
                <button type="button" className={styles.editButton} onClick={onEdit} disabled={isDisabled}>
                    <Pencil className={styles.editButtonIcon} aria-hidden="true" />
                    Editar
                </button>
            </div>
            <div className={styles.configurationValues}>{children}</div>
        </Card>
    );
}

function ConfigurationValue({ label, value }: { label: string; value?: string }) {
    return (
        <div className={styles.configurationValueRow}>
            <span className={styles.configurationValueLabel}>{label}</span>
            <strong className={styles.configurationValue}>{value?.trim() || '—'}</strong>
        </div>
    );
}

function formatMemory(memoryMb: number | null): string | undefined {
    if (memoryMb == null) return undefined;
    return memoryMb >= 1024 ? `${memoryMb / 1024} GB` : `${memoryMb} MB`;
}

const styles = {
    configurationReviewCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-none ring-0',
    reviewTitle: 'mb-1 text-lg font-semibold text-slate-950',
    configurationSectionsGrid: 'grid grid-cols-1 gap-4 md:grid-cols-2',
    configurationSectionCard: 'min-h-52 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-none ring-0',
    configurationSectionHeader: 'flex items-center justify-between gap-4',
    configurationSectionTitleContainer: 'flex min-w-0 items-center gap-3',
    configurationSectionIcon: 'size-5 shrink-0 text-blue-600',
    configurationSectionTitle: 'text-sm font-semibold text-slate-950',
    editButton: 'inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-950 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900',
    editButtonIcon: 'size-3.5 text-slate-950',
    configurationValues: 'grid gap-2.5',
    configurationValueRow: 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-4 text-xs',
    configurationValueLabel: 'text-slate-500',
    configurationValue: 'min-w-0 font-medium text-slate-900',
    creationActionCard: 'min-h-52 justify-between gap-5 rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-none ring-0',
    creationActionTitle: 'mb-2 text-sm font-semibold text-slate-950',
    creationActionDescription: 'text-xs leading-5 text-slate-600',
    createInstanceButton: 'w-full',
    buttonIcon: 'size-4!',
    loadingIcon: 'size-4! animate-spin',
    considerationsNotice: 'flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950',
    considerationsIcon: 'mt-0.5 size-5 shrink-0 text-amber-500',
    considerationsTitle: 'mb-2 text-sm font-semibold',
    considerationsList: 'list-disc space-y-1 pl-5 text-xs leading-5 text-amber-900',
};

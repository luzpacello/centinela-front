import {
    Cpu,
    Database,
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
import {
    INSTANCE_TYPE_OPTIONS,
    NODE_OPTIONS,
    OPERATING_SYSTEM_TEMPLATE_OPTIONS,
    STORAGE_OPTIONS,
    findOptionLabel,
} from '@/components/features/instances/data/createInstanceOptions';
import type { CreateInstanceDraft } from '@/components/features/instances/types/createInstance';

interface ReviewInstanceConfigurationProps {
    draft: CreateInstanceDraft;
    isCreating: boolean;
    onEditStep: (step: number) => void;
    onCreateInstance: () => void;
}

export default function ReviewInstanceConfiguration({
    draft,
    isCreating,
    onEditStep,
    onCreateInstance,
}: ReviewInstanceConfigurationProps) {
    const instanceTypeLabel = INSTANCE_TYPE_OPTIONS.find((option) => option.type === draft.tipo)?.title;
    const destinationNodeLabel = findOptionLabel(NODE_OPTIONS, draft.nodo);
    const selectedStorage = STORAGE_OPTIONS.find((storage) => storage.value === draft.storageId);
    const selectedTemplate = draft.tipo
        ? OPERATING_SYSTEM_TEMPLATE_OPTIONS[draft.tipo].find((template) => template.value === draft.templateOso)
        : undefined;
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
                >
                    <ConfigurationValue label="Tipo de instancia" value={instanceTypeLabel} />
                    <ConfigurationValue label="Nombre" value={draft.nombre} />
                    <ConfigurationValue label="Nodo" value={destinationNodeLabel} />
                    <ConfigurationValue label="Descripción" value={draft.descripcion} />
                </ConfigurationSection>

                <ConfigurationSection
                    icon={Cpu}
                    title="Recursos"
                    onEdit={() => onEditStep(2)}
                >
                    <ConfigurationValue label="vCPU" value={draft.cores == null ? undefined : `${draft.cores} vCPU`} />
                    <ConfigurationValue label="Memoria RAM" value={formatMemory(draft.ramMb)} />
                    <ConfigurationValue label="Disponibilidad del nodo" value="Suficiente" />
                </ConfigurationSection>

                <ConfigurationSection
                    icon={HardDrive}
                    title="Disco"
                    onEdit={() => onEditStep(2)}
                >
                    <ConfigurationValue label="Almacenamiento" value={draft.storageId} />
                    <ConfigurationValue label="Tamaño" value={draft.discoGb == null ? undefined : `${draft.discoGb} GB`} />
                    <ConfigurationValue
                        label="Espacio disponible"
                        value={selectedStorage ? `${selectedStorage.availableGb} GB` : undefined}
                    />
                </ConfigurationSection>

                <ConfigurationSection
                    icon={Network}
                    title="Red"
                    onEdit={() => onEditStep(3)}
                >
                    <ConfigurationValue label="Puente de red" value={draft.red.bridge} />
                    <ConfigurationValue label="Modo de configuración" value={networkModeLabel} />
                    <ConfigurationValue
                        label="Dirección IP"
                        value={draft.red.modo === 'static' ? draft.red.ip : 'Asignación automática'}
                    />
                    <ConfigurationValue label="Prefijo de red (CIDR)" value={draft.red.mascara} />
                    <ConfigurationValue label="Puerta de enlace" value={draft.red.gateway} />
                </ConfigurationSection>

                <ConfigurationSection
                    icon={Database}
                    title="Sistema operativo"
                    onEdit={() => onEditStep(4)}
                >
                    <ConfigurationValue label="Tipo" value={draft.tipo === 'vm' ? 'ISO' : 'Template LXC'} />
                    <ConfigurationValue label="Imagen" value={selectedTemplate?.label} />
                    <ConfigurationValue label="Tamaño" value={selectedTemplate?.size} />
                    <ConfigurationValue label="Sistema operativo" value={selectedTemplate?.operatingSystem} />
                </ConfigurationSection>

                <Card className={styles.creationActionCard}>
                    <div>
                        <h3 className={styles.creationActionTitle}>¿Todo listo para crear la instancia?</h3>
                        <p className={styles.creationActionDescription}>
                            La solicitud se enviará con la configuración revisada y podrás seguir su progreso desde Instancias.
                        </p>
                    </div>
                    <Button
                        type="button"
                        disabled={isCreating}
                        className={styles.createInstanceButton}
                        onClick={onCreateInstance}
                    >
                        {isCreating
                            ? <Loader2 className={styles.loadingIcon} aria-hidden="true" />
                            : <Play className={styles.buttonIcon} aria-hidden="true" />}
                        {isCreating ? 'Creando instancia...' : 'Crear instancia'}
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
}

function ConfigurationSection({
    icon: Icon,
    title,
    children,
    onEdit,
}: ConfigurationSectionProps) {
    return (
        <Card className={styles.configurationSectionCard}>
            <div className={styles.configurationSectionHeader}>
                <span className={styles.configurationSectionTitleContainer}>
                    <Icon className={styles.configurationSectionIcon} aria-hidden="true" />
                    <h3 className={styles.configurationSectionTitle}>{title}</h3>
                </span>
                <button type="button" className={styles.editButton} onClick={onEdit}>
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

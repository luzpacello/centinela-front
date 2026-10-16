import {
    Box,
    Cpu,
    Database,
    HardDrive,
    Info,
    MemoryStick,
    Network,
    Server,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
    findOptionLabel,
    INSTANCE_TYPE_OPTIONS,
    NODE_OPTIONS,
    TEMPLATE_OPTIONS,
} from '@/components/features/instances/data/createInstanceOptions';
import type { CreateInstanceDraft } from '@/components/features/instances/types/createInstance';

interface InstanceCreationSummaryProps {
    draft: CreateInstanceDraft;
}

export default function InstanceCreationSummary({ draft }: InstanceCreationSummaryProps) {
    const typeLabel = INSTANCE_TYPE_OPTIONS.find((option) => option.type === draft.tipo)?.title;
    const nodeLabel = findOptionLabel(NODE_OPTIONS, draft.nodo);
    const templateLabel = draft.tipo
        ? findOptionLabel(TEMPLATE_OPTIONS[draft.tipo], draft.templateOso)
        : undefined;

    return (
        <Card className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Resumen de la instancia</h2>

            <SummarySection title="General">
                <SummaryRow icon={Box} label="Tipo" value={typeLabel} />
                <SummaryRow label="Nombre" value={draft.nombre} />
                <SummaryRow icon={Server} label="Nodo" value={nodeLabel} />
                <SummaryRow icon={HardDrive} label="Plantilla" value={templateLabel} />
                <SummaryRow icon={Database} label="Almacenamiento" value={draft.storageId} />
            </SummarySection>

            <SummarySection title="Recursos">
                <SummaryRow icon={Cpu} label="CPU" value={draft.cores == null ? undefined : `${draft.cores} vCPU`} />
                <SummaryRow icon={MemoryStick} label="Memoria" value={formatMemory(draft.ramMb)} />
                <SummaryRow icon={HardDrive} label="Disco" value={draft.discoGb == null ? undefined : `${draft.discoGb} GB`} />
            </SummarySection>

            <SummarySection title="Red">
                <SummaryRow icon={Network} label="Puente" value={draft.red.bridge} />
                <SummaryRow label="Modo" value={draft.red.modo?.toUpperCase()} />
                <SummaryRow label="Dirección IP" value={draft.red.ip} />
            </SummarySection>

            <SummarySection title="Sistema operativo">
                <SummaryRow icon={HardDrive} label="Template" value={templateLabel} />
            </SummarySection>

            <div className={styles.informationNotice}>
                <Info className={styles.informationIcon} aria-hidden="true" />
                <p>La instancia se creará con la configuración indicada. Podrás modificarla luego si lo necesitas.</p>
            </div>
        </Card>
    );
}

function formatMemory(memoryMb: number | null): string | undefined {
    if (memoryMb == null) return undefined;
    return memoryMb >= 1024 ? `${memoryMb / 1024} GB` : `${memoryMb} MB`;
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className={styles.summarySection}>
            <h3 className={styles.summarySectionTitle}>{title}</h3>
            <div className={styles.summaryRows}>{children}</div>
        </section>
    );
}

function SummaryRow({
    icon: Icon,
    label,
    value,
}: {
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    value?: string;
}) {
    return (
        <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
                {Icon && <Icon className={styles.summaryRowIcon} aria-hidden="true" />}
                {label}
            </span>
            <strong className={styles.summaryValue}>{value?.trim() || '—'}</strong>
        </div>
    );
}

const styles = {
    summaryCard: 'gap-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0',
    summaryTitle: 'mb-5 text-sm font-semibold text-slate-950',
    summarySection: 'border-t border-slate-200 py-4 first:border-t-0 first:pt-0',
    summarySectionTitle: 'mb-3 text-xs font-semibold text-slate-900',
    summaryRows: 'grid gap-3',
    summaryRow: 'flex items-start justify-between gap-4 text-xs',
    summaryLabel: 'flex min-w-0 items-center gap-2 text-slate-500',
    summaryRowIcon: 'size-4 shrink-0 text-slate-500',
    summaryValue: 'max-w-[55%] text-right font-medium text-slate-900',
    informationNotice: 'mt-1 flex gap-3 rounded-lg bg-blue-50 p-4 text-xs leading-5 text-blue-900',
    informationIcon: 'mt-0.5 size-4 shrink-0 text-blue-600',
};

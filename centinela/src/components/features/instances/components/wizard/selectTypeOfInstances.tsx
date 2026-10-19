import { Box, Monitor } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { INSTANCE_TYPE_OPTIONS } from '@/components/features/instances/data/createInstanceOptions';
import type {
    CreateInstanceDraft,
    InstanceType,
    UpdateCreateInstanceField,
} from '@/components/features/instances/types/createInstance';
import { Card } from '@/components/ui/card';

interface SelectTypeOfInstancesProps {
    draft: CreateInstanceDraft;
    onFieldChange: UpdateCreateInstanceField;
    onTypeChange: (type: InstanceType) => void;
}

export default function SelectTypeOfInstances({
    draft,
    onFieldChange,
    onTypeChange,
}: SelectTypeOfInstancesProps) {
    const instanceNameLabel = draft.tipo === 'lxc' ? 'Nombre del contenedor' : 'Nombre de la instancia';

    return (
        <div className={styles.pageContent}>
            <Card className={styles.card}>
                <section className={styles.contentSection} aria-labelledby="instance-type-title">
                    <h3 id="instance-type-title">Tipo de instancia</h3>
                    <div className={styles.instanceTypeGrid}>
                        {INSTANCE_TYPE_OPTIONS.map((option) => {
                            const isSelected = draft.tipo === option.type;
                            const TypeIcon = option.type === 'vm' ? Monitor : Box;

                            return (
                                <button
                                    key={option.type}
                                    type="button"
                                    aria-pressed={isSelected}
                                    className={`${styles.instanceTypeButton} ${isSelected ? styles.selectedInstanceTypeButton : styles.unselectedInstanceTypeButton}`}
                                    onClick={() => onTypeChange(option.type)}
                                >
                                    <span className={`${styles.instanceTypeIconContainer} ${isSelected ? styles.selectedInstanceTypeIconContainer : styles.unselectedInstanceTypeIconContainer}`}>
                                        <TypeIcon className={styles.instanceTypeIcon} aria-hidden="true" />
                                    </span>
                                    <span className={styles.instanceTypeTextContainer}>
                                        <strong className={styles.instanceTypeTitle}>{option.title}</strong>
                                        <span className={styles.instanceTypeDescription}>{option.description}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className={styles.contentSection} aria-labelledby="basic-information-title">
                    <h3 id="basic-information-title">Información básica</h3>
                    <div className={styles.formGrid}>
                        <div className={styles.fieldContainer}>
                            <label className={styles.fieldLabel} htmlFor="instance-name">{instanceNameLabel}</label>
                            <Input
                                id="instance-name"
                                value={draft.nombre}
                                placeholder={draft.tipo === 'lxc' ? 'Ej: app-container' : 'Ej: web-server-01'}
                                onChange={(event) => onFieldChange('nombre', event.target.value)}
                            />
                            <p className={styles.fieldDescription}>Solo letras, números, guiones y puntos. Ej: mi-instancia-01</p>
                        </div>

                        <div className={styles.fieldContainer}>
                            <p className={styles.fieldLabel}>Nodo de destino</p>
                            <p className='text-secundario'>Asignado automáticamente por el servidor.</p>
                        </div>

                        <div className={`${styles.fieldContainer} ${styles.descriptionField}`}>
                            <label className={styles.fieldLabel} htmlFor="instance-description">Descripción (opcional)</label>
                            <div className={styles.textareaContainer}>
                                <Textarea
                                    id="instance-description"
                                    value={draft.descripcion}
                                    maxLength={255}
                                    placeholder="Describe el propósito de la instancia."
                                    className={styles.descriptionTextarea}
                                    onChange={(event) => onFieldChange('descripcion', event.target.value)}
                                />
                                <span className={styles.characterCounter}>{draft.descripcion.length} / 255</span>
                            </div>
                        </div>
                    </div>
                </section>
            </Card>
        </div>
    );
}

const styles = {
    card: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-none ring-0',
    pageContent: 'divide-y divide-slate-200',
    contentSection: 'grid gap-5',
    instanceTypeGrid: 'grid grid-cols-1 gap-4 lg:grid-cols-2',
    instanceTypeButton: 'flex min-h-28 w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
    selectedInstanceTypeButton: 'border-blue-600 bg-blue-50/50',
    unselectedInstanceTypeButton: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30',
    instanceTypeIconContainer: 'flex size-12 shrink-0 items-center justify-center rounded-full',
    selectedInstanceTypeIconContainer: 'bg-blue-100 text-blue-600',
    unselectedInstanceTypeIconContainer: 'bg-slate-100 text-slate-500',
    instanceTypeIcon: 'size-6',
    instanceTypeTextContainer: 'flex min-w-0 flex-col gap-1',
    instanceTypeTitle: 'text-sm font-semibold text-slate-950',
    instanceTypeDescription: 'text-xs leading-5 text-slate-500',
    formGrid: 'grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2',
    fieldContainer: 'min-w-0',
    fieldLabel: 'mb-2 block',
    fieldDescription: 'mt-2',
    descriptionField: 'md:col-span-2',
    textareaContainer: 'relative',
    descriptionTextarea: 'min-h-20 resize-none pb-7',
    characterCounter: 'pointer-events-none absolute bottom-2 right-3 text-[11px] text-slate-500',
};

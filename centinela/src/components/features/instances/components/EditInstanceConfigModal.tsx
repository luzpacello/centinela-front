import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cpu, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalIcon, ModalTitle } from '@/components/ui/modals';
import type { InstanceConfigEditor } from '../hooks/useEditInstanceConfig';
import type { InstanceResourceConfiguration } from '../types/instanceDetail';
import type { InstanceResourceValues } from '../validation/editInstanceConfigValidation';
import InstanceResourceFields from './InstanceResourceFields';

interface EditInstanceConfigModalProps {
    instanceName: string;
    status: string;
    values: InstanceResourceValues;
    current: InstanceResourceValues;
    editor: InstanceConfigEditor;
    canEdit: boolean;
    hasChanges: boolean;
    isSaving: boolean;
    saveError?: string | null;
    confirmInitially?: boolean;
    onChange: (field: keyof InstanceResourceConfiguration, value: number) => void;
    onCancel: () => void;
    onSaved: () => void;
}

export default function EditInstanceConfigModal({ instanceName, status, values, current, editor, canEdit, hasChanges, isSaving, saveError, confirmInitially = false, onChange, onCancel, onSaved }: EditInstanceConfigModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    const [isConfirming, setIsConfirming] = useState(confirmInitially);
    const isSubmitting = isSaving || editor.isCheckingCapacity;
    const canSubmit = canEdit && hasChanges && editor.assessment.canSave && !isSubmitting;
    const changesSummary = [
        values.cores !== current.cores ? `CPU: de ${current.cores} a ${values.cores} núcleos` : null,
        values.ramMb !== current.ramMb ? `Memoria: de ${current.ramMb} a ${values.ramMb} MB` : null,
    ].filter(Boolean).join('. ');

    useEffect(() => {
        const previousFocus = document.activeElement;
        const dialog = dialogRef.current;
        dialog?.showModal();
        return () => { dialog?.close(); if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
    }, []);

    async function submitChanges() {
        if (!canSubmit) return;
        if (!isConfirming) { setIsConfirming(true); return; }
        if (await editor.saveConfiguration()) onSaved();
    }

    return createPortal(<dialog ref={dialogRef} aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
        className="m-auto w-full max-w-[520px] border-0 bg-transparent p-0 outline-none backdrop:bg-black/40"
        onCancel={(event) => { event.preventDefault(); if (!isSubmitting) onCancel(); }}>
        <Modal variant="form" aria-busy={isSubmitting}>
            <ModalHeader>
                <ModalIcon aria-hidden="true"><Cpu /></ModalIcon>
                <ModalTitle id={titleId}>{isConfirming ? 'Confirmar cambios de recursos' : 'Editar recursos'}</ModalTitle>
                <ModalDescription id={descriptionId}>Configuración de CPU y memoria de {instanceName}.</ModalDescription>
            </ModalHeader>
            <ModalContent className="overflow-y-auto">
                {saveError && <FieldError role="alert" className="mb-4">{saveError}</FieldError>}
                {isConfirming && <p role="status" className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                    {changesSummary}. ¿Deseás aplicar estos cambios?
                </p>}
                <InstanceResourceFields values={values} current={current} editor={editor} status={status} disabled={!canEdit || isSubmitting || isConfirming} onChange={onChange} />
            </ModalContent>
            <ModalFooter>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>Cancelar</Button>
                <Button type="button" disabled={!canSubmit} onClick={() => void submitChanges()}>
                    {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {isSubmitting ? 'Guardando…' : isConfirming ? 'Confirmar cambios' : 'Guardar cambios'}
                </Button>
            </ModalFooter>
        </Modal>
    </dialog>, document.body);
}

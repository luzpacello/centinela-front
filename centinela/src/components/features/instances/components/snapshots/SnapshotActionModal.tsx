import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field';
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalIcon, ModalTitle } from '@/components/ui/modals';
import { ApiRequestError } from '@/services/apiClient';
import { snapshotService } from '../../services/snapshotService';

export type SnapshotAction = 'rollback' | 'delete';
export interface SnapshotActionModalProps {
  instanceRef: string | number;
  snapshotName: string;
  canOperate: boolean;
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
  onOutcomeUncertain: () => void;
  onAccepted: (taskId: string, action: SnapshotAction, snapshotName: string) => void;
}

export function SnapshotActionModal({ instanceRef, snapshotName, canOperate, onClose, onSubmittingChange, onOutcomeUncertain, onAccepted, action }: SnapshotActionModalProps & { action: SnapshotAction }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitting = useRef(false);
  const titleId = useId();
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isRollback = action === 'rollback';
  const canSubmit = canOperate && !isSubmitting && (!isRollback || confirmation.trim() === snapshotName);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (previousFocus instanceof HTMLElement) previousFocus.focus(); };
  }, []);

  async function submitAction() {
    if (!canSubmit || submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    onSubmittingChange(true);
    setErrorMessage(null);
    try {
      const response = isRollback
        ? await snapshotService.rollbackSnapshot(instanceRef, snapshotName)
        : await snapshotService.deleteSnapshot(instanceRef, snapshotName);
      onAccepted(response.tareaId, action, snapshotName);
    } catch (error) {
      if (error instanceof ApiRequestError && (error.status === 0 || error.status === 504 || error.errorCode === 'TASK_TRACKING_UNAVAILABLE')) {
        onOutcomeUncertain();
      }
      const message = error instanceof ApiRequestError && error.status === 409 && error.errorCode === 'INSTANCE_BUSY'
        ? 'La instancia está ejecutando otra tarea en Proxmox. Por favor, espere a que finalice.'
        : error instanceof ApiRequestError && error.status === 403
          ? `No posee permisos operativos suficientes para ${isRollback ? 'revertir' : 'eliminar'} snapshots en esta instancia.`
          : error instanceof Error ? error.message : 'No se pudo procesar la solicitud.';
      setErrorMessage(message);
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
      onSubmittingChange(false);
    }
  }

  return createPortal(<dialog ref={dialogRef} aria-labelledby={titleId} aria-modal="true"
    className="m-auto w-full max-w-[520px] border-0 bg-transparent p-0 outline-none backdrop:bg-black/40"
    onCancel={(event) => { event.preventDefault(); if (!submitting.current) onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget && !submitting.current) onClose(); }}>
    <Modal variant="destructive" aria-busy={isSubmitting}>
      <ModalHeader><ModalIcon aria-hidden="true"><TriangleAlert /></ModalIcon>
        <ModalTitle id={titleId}>{isRollback ? 'Revertir snapshot' : 'Eliminar snapshot'}</ModalTitle>
        <ModalDescription>Snapshot seleccionado: <strong>{snapshotName}</strong></ModalDescription>
      </ModalHeader>
      <ModalContent className="space-y-4">
        {isRollback ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
          Advertencia: Esta acción restaurará la máquina al punto seleccionado. Todos los datos, configuraciones y archivos generados con posterioridad se perderán irreversiblemente.
        </div> : <p>La instantánea seleccionada será eliminada del almacenamiento del hipervisor. Esta acción no puede deshacerse.</p>}
        {isRollback && <div className="space-y-2"><label htmlFor={`${titleId}-confirmation`}>Escribí el nombre del snapshot para confirmar.</label>
          <Input id={`${titleId}-confirmation`} aria-label="Confirmar nombre del snapshot" autoComplete="off" value={confirmation}
            disabled={isSubmitting} onChange={(event) => setConfirmation(event.target.value)} /></div>}
        {errorMessage && <FieldError role="alert">{errorMessage}</FieldError>}
      </ModalContent>
      <ModalFooter><Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>Cancelar</Button>
        <Button type="button" variant="destructive" disabled={!canSubmit} onClick={() => void submitAction()}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Procesando…' : isRollback ? 'Revertir Snapshot' : 'Eliminar definitivamente'}
        </Button></ModalFooter>
    </Modal>
  </dialog>, document.body);
}

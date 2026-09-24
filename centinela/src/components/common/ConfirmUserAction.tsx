import { useEffect, useId, useRef, useState } from 'react';
import { CircleHelp, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalIcon } from '@/components/ui/modals';
import { FieldError } from '@/components/ui/field';
import { ApiRequestError } from '@/services/apiClient';

interface ConfirmUserActionProps {
  title: string;
  description: string;
  variant?: 'confirmation' | 'destructive';
  onCompleted: () => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ConfirmUserAction({ title, description, variant = 'confirmation', onCompleted, onConfirm, onCancel }: ConfirmUserActionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submissionInProgress = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.focus({ preventScroll: true });
    return () => dialog?.close();
  }, []);

  async function confirmAction() {
    if (submissionInProgress.current) return;
    submissionInProgress.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm();
      onCompleted();
    } catch (error) {
      // Las respuestas 401/403 ya se notifican globalmente.
      if (!(error instanceof ApiRequestError && [401, 403].includes(error.status))) {
        setErrorMessage(error instanceof Error ? error.message : 'Intentá nuevamente.');
      }
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef}  aria-labelledby={titleId} aria-describedby={descriptionId}
      className="m-auto w-full max-w-[520px] border-0 bg-transparent p-0 outline-none backdrop:bg-black/40"
      onCancel={(event) => { event.preventDefault(); if (!submissionInProgress.current) onCancel(); }}>
      <Modal variant={variant} aria-busy={isSubmitting}>
        <ModalHeader>
          <ModalIcon aria-hidden="true">
            {variant === 'destructive' ? <TriangleAlert /> : <CircleHelp />}
          </ModalIcon>
          <ModalTitle id={titleId}>{title}</ModalTitle>
          <ModalDescription id={descriptionId}>{description}</ModalDescription>
        </ModalHeader>
        {errorMessage && <FieldError role="alert">{errorMessage}</FieldError>}
        <ModalFooter className="py-[30px]">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>Cancelar</Button>
          <Button type="button" disabled={isSubmitting} onClick={() => void confirmAction()}>{isSubmitting ? 'Procesando…' : 'Aceptar'}</Button>
        </ModalFooter>
      </Modal>
    </dialog>
  );
}

import { useEffect, useId, useRef, useState } from 'react';
import { CircleHelp, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalFooter, ModalIcon } from '@/components/ui/modals';
import { FieldError } from '@/components/ui/field';
import { ApiRequestError } from '@/services/apiClient';
import { getErrorMessage } from '@/utils/errorMapper';

interface ConfirmUserActionProps {
  title: string;
  description: string;
  variant?: 'confirmation' | 'destructive';
  confirmLabel?: string;
  onCompleted: () => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  mapErrorMessage?: (error: unknown) => string;
}

const INSTANCE_ERROR_CODES = new Set(['INSTANCE_PROTECTED', 'INSTANCE_ACCESS_DENIED']);

export function ConfirmUserAction({
  title,
  description,
  variant = 'confirmation',
  confirmLabel = 'Aceptar',
  onCompleted,
  onConfirm,
  onCancel,
  mapErrorMessage = getErrorMessage,
}: ConfirmUserActionProps) {
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
      // Las respuestas 401/403 de sesión se notifican globalmente, pero los
      // errores operativos de instancias se muestran en el cuerpo del modal.
      const isInstanceForbidden =
        error instanceof ApiRequestError &&
        error.status === 403 &&
        error.errorCode &&
        INSTANCE_ERROR_CODES.has(error.errorCode);

      if (isInstanceForbidden || !(error instanceof ApiRequestError && [401, 403].includes(error.status))) {
        setErrorMessage(mapErrorMessage(error));
      }
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="m-auto w-full max-w-[520px] border-0 bg-transparent p-0 outline-none backdrop:bg-black/40"
      onCancel={(event) => {
        event.preventDefault();
        if (!submissionInProgress.current) onCancel();
      }}
    >
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
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            disabled={isSubmitting}
            onClick={() => void confirmAction()}
          >
            {isSubmitting ? 'Procesando…' : confirmLabel ?? 'Aceptar'}
          </Button>
        </ModalFooter>
      </Modal>
    </dialog>
  );
}
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Modal,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalIcon,
  ModalTitle,
} from '@/components/ui/modals';
import { ApiRequestError } from '@/services/apiClient';

export interface SecurityReauthCredentials {
  contrasenaActual: string;
  codigo2fa: string;
}

interface SecurityReauthModalProps {
  emailUsuario: string;
  onConfirm: (credentials: SecurityReauthCredentials) => Promise<void>;
  onCancel: () => void;
}

function getReauthErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError && error.errorCode === 'AUTH_FAILED') {
    return 'La contraseña actual no es correcta. Verificala e intentá nuevamente.';
  }
  if (error instanceof ApiRequestError && error.errorCode === 'INVALID_OTP_CODE') {
    return 'El código de autenticación no es válido. Ingresá el código vigente de seis dígitos.';
  }
  return error instanceof Error ? error.message : 'No se pudo verificar tu identidad. Intentá nuevamente.';
}

export function SecurityReauthModal({
  emailUsuario,
  onConfirm,
  onCancel,
}: SecurityReauthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const isFormValid = password.length > 0 && /^\d{6}$/.test(code);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.focus({ preventScroll: true });
    return () => dialog?.close();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !isFormValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm({ contrasenaActual: password, codigo2fa: code });
    } catch (error) {
      setErrorMessage(getReauthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function cancel() {
    if (isSubmitting) return;
    dialogRef.current?.close();
    onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="m-auto w-full max-w-[520px] border-0 bg-transparent p-0 outline-none backdrop:bg-black/40"
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
    >
      <Modal variant="form" aria-busy={isSubmitting}>
        <ModalHeader>
          <ModalIcon aria-hidden="true"><ShieldCheck /></ModalIcon>
          <ModalTitle id={titleId}>Confirmá tu identidad</ModalTitle>
          <ModalDescription id={descriptionId}>
            Por políticas de seguridad, volvé a validar tu identidad para cambiar el correo.
            Enviaremos un enlace de confirmación a <strong>{emailUsuario}</strong>; el cambio
            quedará pendiente hasta que confirmes ese enlace.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={(event) => void submit(event)} noValidate>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="reauth-current-password" className="text-sm font-medium">Contraseña actual</label>
              <Input
                id="reauth-current-password"
                name="contrasenaActual"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                aria-describedby={errorMessage ? errorId : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="reauth-totp-code" className="text-sm font-medium">Código de autenticación (2FA)</label>
              <Input
                id="reauth-totp-code"
                name="codigo2fa"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                required
                value={code}
                aria-describedby={errorMessage ? errorId : undefined}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {errorMessage && <p id={errorId} role="alert" className="mt-4 text-sm text-red-600">{errorMessage}</p>}

          <ModalFooter className="mt-6">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={cancel}>Cancelar</Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Verificando…' : 'Confirmar cambio'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </dialog>
  );
}

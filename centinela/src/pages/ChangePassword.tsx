import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { AuthenticationInputField } from '@/components/features/auth/components/AuthenticationInputField';
import { apiClient, ApiRequestError } from '@/services/apiClient';
import { clearAuthTokens } from '@/services/api';
import { toast } from '@/components/ui/toast';
import { useLogout } from '@/components/features/auth/hooks/useAuth';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 12;

interface ChangePasswordFields {
  contrasenaActual: string;
  contrasenaNueva: string;
  confirmarContrasena: string;
}

type ChangePasswordFieldErrors = Partial<Record<keyof ChangePasswordFields, string>>;

function validateChangePasswordFields(values: ChangePasswordFields): ChangePasswordFieldErrors {
  const errors: ChangePasswordFieldErrors = {};
  if (!values.contrasenaActual.trim()) {
    errors.contrasenaActual = 'Ingresá tu contraseña actual.';
  }
  if (values.contrasenaNueva.length < MIN_PASSWORD_LENGTH || values.contrasenaNueva.length > MAX_PASSWORD_LENGTH) {
    errors.contrasenaNueva = `La contraseña nueva debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.`;
  }
  if (values.confirmarContrasena !== values.contrasenaNueva) {
    errors.confirmarContrasena = 'Las contraseñas nuevas no coinciden.';
  }
  return errors;
}

// Pantalla obligatoria cuando el backend responde PASSWORD_CHANGE_REQUIRED.
// El backend no emite tokens nuevos al cambiarla, así que al terminar se limpia
// la sesión local y se vuelve al login para obtener un token sin el flag.
export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { logout, isLoggingOut } = useLogout();
  const [values, setValues] = useState<ChangePasswordFields>({
    contrasenaActual: '',
    contrasenaNueva: '',
    confirmarContrasena: '',
  });
  const [fieldErrors, setFieldErrors] = useState<ChangePasswordFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(name: keyof ChangePasswordFields, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || isLoggingOut) return;
    const errors = validateChangePasswordFields(values);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await apiClient.request<{ message?: string }>('/account/password', {
        method: 'PUT',
        payload: {
          contrasenaActual: values.contrasenaActual,
          contrasenaNueva: values.contrasenaNueva,
        },
      });
      clearAuthTokens();
      toast.add({
        title: 'Contraseña actualizada',
        description: 'Iniciá sesión nuevamente con tu nueva contraseña.',
        type: 'success',
        priority: 'high',
      });
      navigate('/login', { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiRequestError
        ? error.message
        : 'No se pudo cambiar la contraseña. Intentá nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.cardPrincipal}>
      <div className={styles.cardCircular}>
        <LockKeyhole aria-hidden="true" className="size-12 text-[#2563eb]" strokeWidth={1.75} />
      </div>

      <h1>Cambio obligatorio de contraseña</h1>
      <p className="text-secundario">Tu cuenta tiene una contraseña temporal. Definí una nueva para poder continuar.</p>

      <form noValidate onSubmit={handleSubmit} aria-busy={isSubmitting || isLoggingOut} className="flex w-full flex-col gap-5">
        <AuthenticationInputField
          id="change-password-current" name="contrasenaActual" label="Contraseña actual" type="password"
          autoComplete="current-password" placeholder="Contraseña actual" required disabled={isSubmitting || isLoggingOut}
          value={values.contrasenaActual} error={fieldErrors.contrasenaActual}
          onChange={(event) => updateField('contrasenaActual', event.target.value)}
        />

        <AuthenticationInputField
          id="change-password-new" name="contrasenaNueva" label="Contraseña nueva" type="password"
          autoComplete="new-password" placeholder="Entre 8 y 12 caracteres" required disabled={isSubmitting || isLoggingOut}
          value={values.contrasenaNueva} error={fieldErrors.contrasenaNueva}
          onChange={(event) => updateField('contrasenaNueva', event.target.value)}
        />

        <AuthenticationInputField
          id="change-password-confirmation" name="confirmarContrasena" label="Confirmar contraseña nueva" type="password"
          autoComplete="new-password" placeholder="Repetí la contraseña nueva" required disabled={isSubmitting || isLoggingOut}
          value={values.confirmarContrasena} error={fieldErrors.confirmarContrasena}
          onChange={(event) => updateField('confirmarContrasena', event.target.value)}
        />

        {formError && <FieldError>{formError}</FieldError>}

        <Button type="submit" className="w-full" disabled={isSubmitting || isLoggingOut}>
          {isSubmitting ? 'Cambiando contraseña…' : 'Cambiar contraseña'}
        </Button>
        <Button
          type="button"
          role="button"
          variant="outline"
          className="w-full"
          disabled={isSubmitting || isLoggingOut}
          onClick={() => void logout()}
        >
          Cerrar sesión
        </Button>
      </form>
    </section>
  );
}

const styles = {
  cardPrincipal: "flex min-h-[650px] w-full max-w-[620px] flex-col items-center justify-center gap-5 rounded-[12px] border border-[#e2e8f0] bg-white px-6 py-10 text-center shadow-[4px_4px_4px_0px_#0000001a] sm:px-15",
  cardCircular: "mb-5 flex h-25 w-25 items-center justify-center rounded-full bg-[#bfdbfe]",
};

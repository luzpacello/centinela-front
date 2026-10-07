import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useLogin } from '../hooks/useLogin';
import { AuthenticationInputField } from './AuthenticationInputField';
import { Link } from 'react-router/internal/react-server-client';

// Sans geométrica del diseño de login (la app por defecto usa JetBrains Mono).
const INTER = "font-[family-name:'Inter',ui-sans-serif,system-ui,sans-serif]";
const INPUT_CLASS = `${INTER} h-12 rounded-[10px] border-[#d9dce2] text-[15px] font-normal text-[#0f172a] hover:border-[#d9dce2]`;
const LABEL_CLASS = 'text-[14px] font-semibold text-[#0f172a]';

export default function LoginForm({ initialEmail = '' }: { initialEmail?: string }) {
  const { values, fieldErrors, formError, isSubmitting, updateField, validateField, submitForm } = useLogin(initialEmail);
  const [googleMessage, setGoogleMessage] = useState('');

  return (
    <form noValidate onSubmit={submitForm} aria-busy={isSubmitting} className={`flex w-full flex-col gap-5 ${INTER}`}>
      <FieldGroup>
        <AuthenticationInputField
          id="login-email" name="email" label="Correo electrónico" type="email"
          autoComplete="username" autoCapitalize="none" spellCheck={false}
          placeholder="ejemplo@correo.com" required disabled={isSubmitting}
          value={values.email} error={fieldErrors.email}
          icon={<Mail className="size-5" />} className={INPUT_CLASS} labelClassName={LABEL_CLASS}
          onChange={(event) => updateField('email', event.target.value)} onBlur={() => validateField('email')}
        />

        <AuthenticationInputField
          id="login-password" name="password" label="Contraseña" type="password"
          autoComplete="current-password" placeholder="Ingresá tu contraseña" required disabled={isSubmitting}
          value={values.password} error={fieldErrors.password}
          icon={<Lock className="size-5" />} className={INPUT_CLASS} labelClassName={LABEL_CLASS}
          onChange={(event) => updateField('password', event.target.value)} onBlur={() => validateField('password')}
        />

        <div className="flex items-center justify-between gap-3">
          <Field orientation="horizontal" className="w-auto">
            <Checkbox id="remember-me" name="recordarSesion" checked={values.recordarSesion}
              onCheckedChange={(checked) => updateField('recordarSesion', checked)} disabled={isSubmitting} />
            <FieldLabel htmlFor="remember-me" className="text-[14px] font-normal text-[#64748b]">Recordarme</FieldLabel>
          </Field>
          <Link to="/recover-password" className="text-[14px] font-medium text-[#2563eb] hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>
      </FieldGroup>

      {formError && <FieldError>{formError}</FieldError>}

      <Button
        type="submit"
        className={`${INTER} h-[52px] w-full rounded-[10px] text-[15px] font-semibold`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </Button>

      {/* Separador con punto centrado */}
      <div className="relative flex h-5 items-center justify-center" aria-hidden="true">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#e2e8f0]" />
        <span className="relative z-10 size-1.5 rounded-full bg-[#cbd5e1] ring-4 ring-white" />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => setGoogleMessage('El acceso con Google todavía no está disponible.')}
        className={`${INTER} h-[52px] w-full rounded-[10px] border-[#d9dce2] bg-white text-[15px] font-semibold text-[#0f172a] hover:border-[#d9dce2] hover:bg-[#f8fafc] focus-visible:bg-[#f8fafc] active:bg-[#f1f5f9]`}
      >
        <GoogleIcon />
        Continuar con Google
      </Button>
      {googleMessage && <p role="status" className="text-center text-[13px] text-[#64748b]">{googleMessage}</p>}

      <p className="text-center text-[14px] text-[#64748b]">
        ¿No tenés una cuenta? <Link to="/signup" className="font-medium text-[#2563eb] hover:underline">Creá tu organización</Link>
      </p>
    </form>
  );
}

// Logo "G" multicolor de Google, embebido para no depender de assets externos.
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

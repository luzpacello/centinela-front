import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useLogin } from '../hooks/useLogin';
import { AuthenticationInputField } from './AuthenticationInputField';

export default function LoginForm({ initialEmail = '' }: { initialEmail?: string }) {
  const { values, fieldErrors, formError, isSubmitting, updateField, validateField, submitForm } = useLogin(initialEmail);
  return (
    <form noValidate onSubmit={submitForm} aria-busy={isSubmitting} className="flex w-full flex-col gap-5">
      <FieldGroup>
        <AuthenticationInputField
          id="login-email" name="email" label="Correo electrónico" type="email"
          autoComplete="username" autoCapitalize="none" spellCheck={false}
          placeholder="ejemplo@correo.com" required disabled={isSubmitting}
          value={values.email} error={fieldErrors.email}
          onChange={(event) => updateField('email', event.target.value)} onBlur={() => validateField('email')}
        />

        <AuthenticationInputField
          id="login-password" name="password" label="Contraseña" type="password"
          autoComplete="current-password" placeholder="Contraseña" required disabled={isSubmitting}
          value={values.password} error={fieldErrors.password}
          onChange={(event) => updateField('password', event.target.value)} onBlur={() => validateField('password')}
        />

        <Field orientation="horizontal">
          <Checkbox id="remember-me" name="rememberMe" checked={values.rememberMe}
            onCheckedChange={(checked) => updateField('rememberMe', checked)} disabled={isSubmitting} />
          <FieldLabel htmlFor="remember-me">Recordarme</FieldLabel>
        </Field>
        
      </FieldGroup>
      {formError && <FieldError>{formError}</FieldError>}
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </Button>
      <p className="text-secundario">¿No tenés una cuenta? <Link to="/signup" className="text-info">Creá una organización</Link></p>
    </form>
  );
}

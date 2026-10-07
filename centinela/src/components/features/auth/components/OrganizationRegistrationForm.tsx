import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { useOrganizationRegistration } from '../hooks/useOrganizationRegistration';
import { minimumRegistrationPasswordLength } from '../utils/validateAuthenticationFields';
import { AuthenticationInputField } from './AuthenticationInputField';

export default function OrganizationRegistrationForm() {
  const { values, fieldErrors, formError, isSubmitting, result, updateField, validateField, submitForm } = useOrganizationRegistration();

  if (result?.success) {
    const { organization } = result;
    return (
      <div className="flex w-full flex-col gap-5 text-left">
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
          <h2 className="font-semibold">Organización creada</h2>
          <p>Se creó {organization.name} con {organization.adminUser.fullName} como administrador inicial.</p>
          <p>Iniciá sesión con {organization.adminUser.email} para continuar.</p>
        </div>
        <Link to="/login" state={{ email: organization.adminUser.email }} className="text-info underline">Ir al inicio de sesión</Link>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submitForm} aria-busy={isSubmitting} className="flex w-full flex-col gap-5">
      <FieldGroup>
        <AuthenticationInputField
          id="registration-full-name" name="fullName" label="Nombre completo" autoComplete="name" placeholder="Ej: Juan Pérez"
          required disabled={isSubmitting} value={values.fullName} error={fieldErrors.fullName}
          onChange={(event) => updateField('fullName', event.target.value)} onBlur={() => validateField('fullName')}
        />

        <AuthenticationInputField
          id="registration-username" name="username" label="Nombre de usuario" autoComplete="username" placeholder="Ej: juan_perez"
          autoCapitalize="none" spellCheck={false} description="Usá letras, números, puntos, guiones o guiones bajos."
          required disabled={isSubmitting} value={values.username} error={fieldErrors.username}
          onChange={(event) => updateField('username', event.target.value)} onBlur={() => validateField('username')}
        />

        <AuthenticationInputField
          id="registration-email" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="Ej: juan@ejemplo.com"
          autoCapitalize="none" spellCheck={false} required disabled={isSubmitting} value={values.email} error={fieldErrors.email}
          onChange={(event) => updateField('email', event.target.value)} onBlur={() => validateField('email')}
        />

        <AuthenticationInputField
          id="registration-organization" name="organizationName" label="Nombre de la organización" autoComplete="organization"
          placeholder="Ej: Mi Organización, Universidad, DevOps Team" description="Este nombre será visible para todos los usuarios de tu organización."
          required disabled={isSubmitting} value={values.organizationName} error={fieldErrors.organizationName}
          onChange={(event) => updateField('organizationName', event.target.value)} onBlur={() => validateField('organizationName')}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <AuthenticationInputField
            id="registration-password" name="password" label="Contraseña" type="password" autoComplete="new-password" placeholder="Contraseña"
            description={`Usá al menos ${minimumRegistrationPasswordLength} caracteres.`} minLength={minimumRegistrationPasswordLength}
            required disabled={isSubmitting} value={values.password} error={fieldErrors.password}
            onChange={(event) => updateField('password', event.target.value)} onBlur={() => validateField('password')}
          />
          <AuthenticationInputField
            id="registration-password-confirmation" name="passwordConfirmation" label="Repetir contraseña" type="password" autoComplete="new-password"
            placeholder="Repetir contraseña" required disabled={isSubmitting} value={values.passwordConfirmation} error={fieldErrors.passwordConfirmation}
            onChange={(event) => updateField('passwordConfirmation', event.target.value)} onBlur={() => validateField('passwordConfirmation')}
          />
        </div>

        <Field orientation="horizontal" data-invalid={Boolean(fieldErrors.acceptedTerms)} className="text-left">
          <Checkbox id="accepted-terms" name="acceptedTerms" checked={values.acceptedTerms}
            onCheckedChange={(checked) => updateField('acceptedTerms', checked)} disabled={isSubmitting}
            aria-required="true" aria-invalid={Boolean(fieldErrors.acceptedTerms)}
            aria-describedby={fieldErrors.acceptedTerms ? 'accepted-terms-error' : undefined} />
          <FieldContent>
            <FieldLabel htmlFor="accepted-terms">Acepto los Términos de servicio y la Política de privacidad</FieldLabel>
            {fieldErrors.acceptedTerms && <FieldError id="accepted-terms-error">{fieldErrors.acceptedTerms}</FieldError>}
          </FieldContent>
        </Field>
      </FieldGroup>

      {formError && <FieldError>{formError}</FieldError>}
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creando organización…' : 'Crear organización y continuar'}
      </Button>
      <p className="text-secundario">¿Ya tenés una cuenta? <Link to="/login" className="text-info">Iniciá sesión</Link></p>
    </form>
  );
}

import type { FieldErrors, LoginCredentials, OrganizationRegistrationFields } from '../types/authentication.ts';

export const minimumRegistrationPasswordLength = 8;

export function validateEmailAddress(email: string): string | undefined {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) return 'Ingresá tu correo electrónico.';
  const emailPattern = /^[^\s@.]+(?:\.[^\s@.]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  
  if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
    return 'Ingresá un correo completo y válido, por ejemplo nombre@correo.com.';
  }
  // La existencia del correo y su disponibilidad solo pueden confirmarse en el backend.
}

export function validateLoginFields(fields: LoginCredentials): FieldErrors<LoginCredentials> {
  const errors: FieldErrors<LoginCredentials> = {};
  const emailError = validateEmailAddress(fields.email);
  
  if (emailError) errors.email = emailError;
  if (!fields.password.trim()) errors.password = 'Ingresá tu contraseña.';
  return errors;
}

export function validateOrganizationRegistrationFields(
  fields: OrganizationRegistrationFields,
): FieldErrors<OrganizationRegistrationFields> {
  const errors: FieldErrors<OrganizationRegistrationFields> = validateLoginFields({ ...fields, recordarSesion: false });
  
  if (!fields.organizationName.trim()) errors.organizationName = 'Ingresá el nombre de la organización.';
  if (!fields.fullName.trim()) errors.fullName = 'Ingresá tu nombre completo.';
  if (!fields.username.trim()) {
    errors.username = 'Ingresá un nombre de usuario.';
  } else if (!/^[a-zA-Z0-9._-]+$/.test(fields.username.trim())) {
    errors.username = 'Usá letras, números, puntos, guiones o guiones bajos, sin espacios.';
  }
  // El contrato no fija una política: este mínimo es ajustable y el backend decide la fortaleza final.
  if (!errors.password && fields.password.length < minimumRegistrationPasswordLength) {
    errors.password = `Usá al menos ${minimumRegistrationPasswordLength} caracteres.`;
  }
  if (!fields.passwordConfirmation) {
    errors.passwordConfirmation = 'Repetí tu contraseña.';
  } else if (fields.passwordConfirmation !== fields.password) {
    errors.passwordConfirmation = 'Las contraseñas no coinciden.';
  }
  if (!fields.acceptedTerms) errors.acceptedTerms = 'Aceptá los términos para continuar.';
  
  return errors;
}

export interface PasswordComplexityResult {
  isValid: boolean;
  missingConditions: string[];
}

export function validatePasswordComplexity(
  password: string
) : PasswordComplexityResult { 
  const missingConditions: string[] = [];
  if (password.length < 8 || password.length > 12) {
    missingConditions.push('Debe tener entre 8 y 12 caracteres.');
  }
  if (!/[A-Z]/.test(password)) {
    missingConditions.push('Debe contener al menos una letra mayúscula.');
  }
  if (!/[0-9]/.test(password)) {
    missingConditions.push('Debe contener al menos un número.');
  }
  if (!/[!@#$%^&*\-_=+]/.test(password)) {
    missingConditions.push('Debe contener al menos un carácter especial(!@#$%^&-_=+).',);
  }
  return {
    isValid: missingConditions.length === 0,
    missingConditions,
  };
}
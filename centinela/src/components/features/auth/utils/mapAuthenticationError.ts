import { ApiRequestError } from '../../../../services/api.js';
import type { AuthenticationFailure } from '../types/authentication.ts';

const loginErrorMessages: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'El correo electrónico o la contraseña son incorrectos.',
  USER_NOT_FOUND: 'No se encontró una cuenta con ese correo electrónico.',
  ACCOUNT_INACTIVE: 'La cuenta se encuentra inactiva. Contacte al administrador del sistema.',
  ACCOUNT_BLOCKED: 'La cuenta se encuentra bloqueada. Contacte al administrador del sistema.',
};

export function mapAuthenticationError<Fields>(error: unknown, operation: 'login' | 'registration'): AuthenticationFailure<Fields> {
  const failure: AuthenticationFailure<Fields> = { success: false, fieldErrors: {} };
  if (!(error instanceof ApiRequestError)) {
    return { ...failure, message: 'No se pudo completar la operación. Intentá nuevamente.' };
  }
  const fallbackMessage = operation === 'registration' && error.status === 409
    ? 'El correo, el nombre de usuario o la organización ya están registrados.'
    : operation === 'registration' && error.status === 400
      ? 'Revisá los datos ingresados y la fortaleza de la contraseña.'
      : error.message;
  return {
    ...failure,
    errorCode: error.errorCode,
    message: operation === 'login' && error.errorCode && loginErrorMessages[error.errorCode]
      ? loginErrorMessages[error.errorCode]
      : error.message === 'No se pudo completar la solicitud. Intentá nuevamente.' ? fallbackMessage : error.message,
  };
}

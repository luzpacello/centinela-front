import { ApiRequestError } from '../../../../services/api.js';
import type { AuthenticationFailure } from '../types/authentication.ts';

// Codes reales del backend El Centinela.
const authenticationErrorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: 'El correo electrónico o la contraseña son incorrectos.',
  ACCOUNT_INACTIVE: 'La cuenta se encuentra inactiva. Contactá al administrador del sistema.',
  PASSWORD_CHANGE_REQUIRED: 'Tenés que cambiar tu contraseña antes de continuar.',
  INVALID_TWO_FACTOR: 'El código de verificación es incorrecto o expiró.',
  INVALID_CHALLENGE: 'La verificación expiró. Volvé a iniciar sesión.',
  INVALID_SESSION: 'Tu sesión expiró. Volvé a iniciar sesión.',
  INVALID_REQUEST: 'Revisá los datos ingresados e intentá nuevamente.',
};

export function mapAuthenticationError<Fields>(
  error: unknown,
  operation: 'login' | 'registration' | 'twoFactor',
): AuthenticationFailure<Fields> {
  const failure: AuthenticationFailure<Fields> = { success: false, fieldErrors: {} };
  if (!(error instanceof ApiRequestError)) {
    return { ...failure, message: 'No se pudo completar la operación. Intentá nuevamente.' };
  }
  const fallbackMessage = operation === 'registration' && error.status === 409
    ? 'El correo, el nombre de usuario o la organización ya están registrados.'
    : operation === 'registration' && error.status === 400
      ? 'Revisá los datos ingresados y la fortaleza de la contraseña.'
      : error.message;
  const mappedMessage = error.errorCode && authenticationErrorMessages[error.errorCode];
  return {
    ...failure,
    errorCode: error.errorCode,
    message: mappedMessage
      ?? (error.message === 'No se pudo completar la solicitud. Intentá nuevamente.' ? fallbackMessage : error.message),
  };
}

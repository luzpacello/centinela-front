import { ApiRequestError } from '../../../../services/api.js';
import type { AuthenticationFailure } from '../types/authentication.ts';

// Mensajes propios para los códigos que emite hoy el backend.
// AUTH_FAILED queda afuera a propósito: el backend lo usa tanto para credenciales
// incorrectas como para cuenta desactivada, así que su mensaje es más preciso que uno fijo.
const authenticationErrorMessages: Record<string, string> = {
  INVALID_REQUEST: 'Revisá los datos ingresados e intentá nuevamente.',
  TOTP_FAILED: 'El código de verificación es incorrecto o ya se usó. Esperá al siguiente e intentá de nuevo.',
  TWO_FACTOR_ALREADY_ENABLED: 'Esta cuenta ya tiene el doble factor activo. Para vincular uno nuevo hace falta un restablecimiento administrativo.',
  QR_ERROR: 'No se pudo generar el código QR. Intentá nuevamente en unos segundos.',
  USER_CONFLICT: 'Ya existe un usuario con el mismo nombre de usuario o correo.',
  UPDATE_CONFLICT: 'El usuario fue modificado desde otra sesión. Recargá los datos e intentá nuevamente.',
  PROFILE_UPDATE_CONFLICT: 'Tu perfil fue modificado desde otra sesión. Recargá los datos e intentá nuevamente.',
  USER_NOT_FOUND: 'No se encontró el usuario solicitado.',
  SELF_DELETE_NOT_ALLOWED: 'No podés eliminar tu propio usuario.',
  PASSWORD_CHANGE_FAILED: 'No se pudo cambiar la contraseña. Revisá los datos e intentá nuevamente.',
  REFRESH_FAILED: 'Tu sesión expiró. Volvé a iniciar sesión.',
  INVALID_UUID: 'El identificador proporcionado no es válido.',
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

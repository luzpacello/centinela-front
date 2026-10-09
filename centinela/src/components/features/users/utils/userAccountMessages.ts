import { ApiRequestError } from '@/services/apiClient';

export const userSuspensionMessage = 'Al desactivar este usuario, no podrá iniciar sesión pero su correo seguirá reservado. Esta acción es reversible.';
export const userDeletionMessage = 'Esta acción dará de baja definitiva al usuario e invalidará todas sus sesiones. Su historial quedará preservado para auditoría y su correo quedará liberado para registrar una nueva cuenta.';
export const userReactivationMessage = 'El usuario podrá volver a iniciar sesión con sus credenciales y permisos actuales.';
export const userEmailConflictMessage = 'El correo ya se encuentra en uso por una cuenta activa o suspendida.';

export function isUserEmailConflict(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 409
    && error.errorCode === 'USER_EMAIL_ALREADY_EXISTS';
}

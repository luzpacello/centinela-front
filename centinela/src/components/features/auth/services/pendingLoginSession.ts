import type { LoginResponse } from '../types/authentication.ts';

export { savePendingLoginSession, readPendingLoginSession, clearPendingLoginSession } from '../../../../storage/tokenStorage.ts';

// Con el segundo factor ya vinculado se pide el código; si no, se muestra el QR.
export function getPendingTwoFactorPath(response: LoginResponse): string {
  return response.totpVinculado ? '/two-factor/verify' : '/two-factor/setup';
}

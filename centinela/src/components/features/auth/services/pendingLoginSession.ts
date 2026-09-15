import type { LoginResponse } from '../types/authentication.ts';

// Se conserva en memoria para navegar sin persistir contraseñas ni secretos TOTP en el navegador.
// Recargar la página requiere iniciar sesión nuevamente; la expiración real la decide el backend.
let pendingLoginSession: LoginResponse | null = null;

export function savePendingLoginSession(response: LoginResponse): void {
  pendingLoginSession = response;
}

export function readPendingLoginSession(): LoginResponse | null {
  return pendingLoginSession;
}

export function clearPendingLoginSession(): void {
  pendingLoginSession = null;
}

// Con el segundo factor ya vinculado se pide el código; si no, se muestra el QR.
export function getPendingTwoFactorPath(response: LoginResponse): string {
  return response.totpVinculado ? '/two-factor/verify' : '/two-factor/setup';
}

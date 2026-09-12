import type { LoginResponse } from '../types/authentication.ts';

// Se conserva en memoria para navegar sin persistir contraseñas, secretos TOTP ni tokens en el navegador.
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

export function getPendingTwoFactorPath(response: LoginResponse): string {
  return response.require2faSetup ? '/two-factor/setup' : '/two-factor/verify';
}

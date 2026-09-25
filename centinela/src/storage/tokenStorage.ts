import type { LoginResponse } from '../components/features/auth/types/authentication.ts';
import { isLoginResponse } from '../components/features/auth/utils/validateAuthenticationResponses.ts';

const pendingLoginKey = 'centinela_pending_login';
const accessTokenKey = 'centinela_access';
// Se guarda el refresh token en sessionStorage para que se borre al cerrar la pestaña. El real se guarda en cookie HttpOnly para que el backend lo use en /auth/refresh.
const refreshTokenKey = 'centinela_refresh';
const userSessionKey = 'centinela_user';

export function savePendingLoginSession(response: LoginResponse): void {
  // Los indicadores permiten restaurar el paso de 2FA después de recargar.
  window.sessionStorage.setItem(pendingLoginKey, JSON.stringify({
    jwtTemporal: response.jwtTemporal,
    totpVinculado: response.totpVinculado,
    cambioContrasenaRequerido: response.cambioContrasenaRequerido,
  }));
}

export function readPendingLoginSession(): LoginResponse | null {
  const raw = window.sessionStorage.getItem(pendingLoginKey);
  if (!raw) return null;
  try {
    const response: unknown = JSON.parse(raw);
    if (isLoginResponse(response)) return response;
  } catch {
    // Un valor corrupto no permite continuar con el segundo factor.
  }
  clearPendingLoginSession();
  return null;
}

export function clearPendingLoginSession(): void {
  window.sessionStorage.removeItem(pendingLoginKey);
}

export function getAccessToken(): string | null {
  return window.sessionStorage.getItem(accessTokenKey);
}

export function storeAuthTokens({ accessToken }: { accessToken?: string } = {}): void {
  if (accessToken) {
    window.sessionStorage.setItem(accessTokenKey, accessToken);
    clearPendingLoginSession();
  }
}

export function clearAuthTokens(): void {
  window.sessionStorage.removeItem(accessTokenKey);
  window.sessionStorage.removeItem(refreshTokenKey);
  window.sessionStorage.removeItem(userSessionKey);
  clearPendingLoginSession();
}

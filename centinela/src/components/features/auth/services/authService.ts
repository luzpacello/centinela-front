import {
  ApiRequestError,
  clearAuthTokens,
  getRefreshToken,
  sendJsonPostRequest,
  storeAuthTokens,
  storeUserSession,
} from '../../../../services/api.js';
import type { LoginCredentials, LoginResponse } from '../types/authentication.ts';
import { isLoginResponse } from '../utils/validateAuthenticationResponses.ts';

export async function submitLoginCredentials(credentials: LoginCredentials, signal?: AbortSignal): Promise<LoginResponse> {
  const response = await sendJsonPostRequest('/auth/login', {
    email: credentials.email.trim(),
    password: credentials.password,
    recordarSesion: credentials.recordarSesion,
  }, { signal, expectedStatus: 200 });

  if (!isLoginResponse(response)) {
    throw new ApiRequestError('La respuesta del servidor no permite continuar con la autenticación.');
  }
  return response;
}

export async function logoutSession(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await sendJsonPostRequest('/auth/logout', { refreshToken }, { expectedStatus: 200 });
    }
  } finally {
    // Siempre se limpia la sesión local aunque el backend falle o el token ya no exista.
    clearAuthTokens();
  }
}

// Guarda la sesión emitida (tokens + perfil) para las llamadas autenticadas futuras.
export function persistSession(response: LoginResponse): void {
  if (response.accessToken) {
    storeAuthTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken });
  }
  if (response.user) {
    storeUserSession(response.user);
  }
}

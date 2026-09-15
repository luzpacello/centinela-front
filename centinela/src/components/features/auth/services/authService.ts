import {
  ApiRequestError,
  clearAuthTokens,
  getRefreshToken,
  sendJsonGetRequest,
  sendJsonPostRequest,
  storeAuthTokens,
  storeUserSession,
} from '../../../../services/api.js';
import type { LoginCredentials, LoginResponse, TokenResponse, UserSession } from '../types/authentication.ts';
import {
  isLoginResponse,
  isPerfilResponse,
  isTokenResponse,
  mapPerfilToUserSession,
} from '../utils/validateAuthenticationResponses.ts';

// POST /auth/login — valida credenciales y devuelve el JWT temporal del flujo 2FA.
// No emite tokens de sesión ni datos del usuario: eso ocurre al completar el 2FA.
export async function submitLoginCredentials(credentials: LoginCredentials, signal?: AbortSignal): Promise<LoginResponse> {
  const response = await sendJsonPostRequest('/auth/login', {
    email: credentials.email.trim(),
    password: credentials.password,
  }, { signal, expectedStatus: 200 });

  if (!isLoginResponse(response)) {
    throw new ApiRequestError('La respuesta del servidor no permite continuar con la autenticación.');
  }
  return response;
}

// GET /account/profile — fuente de los datos del usuario para la sesión local.
export async function fetchUserProfile(signal?: AbortSignal): Promise<UserSession> {
  const perfil = await sendJsonGetRequest('/account/profile', { signal, auth: true, expectedStatus: 200 });
  if (!isPerfilResponse(perfil)) {
    throw new ApiRequestError('No se pudo interpretar el perfil del usuario.');
  }
  return mapPerfilToUserSession(perfil);
}

// Guarda los tokens emitidos al completar el 2FA y a continuación guarda el perfil.
export async function persistSessionFromTokens(tokens: TokenResponse, signal?: AbortSignal): Promise<UserSession> {
  if (!isTokenResponse(tokens)) {
    throw new ApiRequestError('La respuesta del servidor no contiene una sesión válida.');
  }
  storeAuthTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  const user = await fetchUserProfile(signal);
  storeUserSession(user);
  return user;
}

// POST /auth/logout — responde 204 sin cuerpo.
export async function logoutSession(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await sendJsonPostRequest('/auth/logout', { refreshToken }, { expectedStatus: 204 });
    }
  } finally {
    // Siempre se limpia la sesión local aunque el backend falle o el token ya no exista.
    clearAuthTokens();
  }
}

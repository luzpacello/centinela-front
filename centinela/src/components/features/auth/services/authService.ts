import {
  ApiRequestError,
  clearAuthTokens,
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

// Estado en el que el backend bloquea toda petición autenticada (incluido
// GET /account/profile) con 403 PASSWORD_CHANGE_REQUIRED hasta que el usuario
// cambie su contraseña temporal. Se distingue de un fallo real para que el
// llamador derive a /change-password en vez de mostrar un error genérico.
export class PasswordChangeRequiredError extends Error {
  constructor() {
    super('Debe cambiar su contraseña temporal antes de continuar.');
    this.name = 'PasswordChangeRequiredError';
  }
}

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

// Guarda el access token emitido al completar el 2FA y luego el perfil.
// Si el backend responde 403 PASSWORD_CHANGE_REQUIRED, el access token queda
// guardado para la pantalla de cambio, pero no se guarda la sesión de
// usuario: se lanza PasswordChangeRequiredError para que el llamador derive.
export async function persistSessionFromTokens(tokens: TokenResponse, signal?: AbortSignal): Promise<UserSession> {
  if (!isTokenResponse(tokens)) {
    throw new ApiRequestError('La respuesta del servidor no contiene una sesión válida.');
  }
  storeAuthTokens({ accessToken: tokens.accessToken });
  let user: UserSession;
  try {
    user = await fetchUserProfile(signal);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 403 && error.errorCode === 'PASSWORD_CHANGE_REQUIRED') {
      throw new PasswordChangeRequiredError();
    }
    throw error;
  }
  storeUserSession(user);
  return user;
}

// POST /auth/logout — responde 204 sin cuerpo.
export async function logoutSession(): Promise<void> {
  try {
    await sendJsonPostRequest('/auth/logout', {}, { expectedStatus: 204 });
  } finally {
    // Siempre se limpia la sesión local aunque el backend falle o el token ya no exista.
    clearAuthTokens();
  }
}

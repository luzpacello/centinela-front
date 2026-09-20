import { clearAuthTokens as clearStoredAuthTokens, getAccessToken, getRefreshToken, storeAuthTokens } from '../storage/tokenStorage.ts';
import { ApiRequestError, apiClient } from './apiClient.ts';

export { getAccessToken, getRefreshToken, storeAuthTokens };
export { ApiRequestError };

const userSessionKey = 'centinela_user';

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // El almacenamiento puede estar bloqueado (modo privado); la sesión queda solo en memoria.
  }
}

function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Sin acción.
  }
}

export function storeUserSession(user) {
  if (user) writeStorage(userSessionKey, JSON.stringify(user));
}

export function getStoredUserSession() {
  const raw = readStorage(userSessionKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthTokens() {
  clearStoredAuthTokens();
  removeStorage(userSessionKey);
}

async function executeJsonRequest(path, payload, { method = 'POST', signal, auth = false, bearer, expectedStatus } = {}) {
  // `auth` se conserva por compatibilidad: el cliente ahora inyecta el token
  // automáticamente en todas las solicitudes salientes.
  void auth;
  return apiClient.request(path, { method, payload, signal, bearer, expectedStatus });
}

export async function sendJsonPostRequest(path, payload, { signal, expectedStatus, auth = false, bearer } = {}) {
  return executeJsonRequest(path, payload, { signal, auth, bearer, expectedStatus });
}

// Lecturas autenticadas (por ejemplo GET /account/profile).
export async function sendJsonGetRequest(path, { signal, expectedStatus, auth = false, bearer } = {}) {
  return executeJsonRequest(path, undefined, { method: 'GET', signal, auth, bearer, expectedStatus });
}

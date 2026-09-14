export class ApiRequestError extends Error {
  constructor(message, status = 0, errorCode = undefined) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

const accessTokenKey = 'centinela_access';
const refreshTokenKey = 'centinela_refresh';
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

export function getAccessToken() {
  return readStorage(accessTokenKey);
}

export function getRefreshToken() {
  return readStorage(refreshTokenKey);
}

export function storeAuthTokens({ accessToken, refreshToken } = {}) {
  if (accessToken) writeStorage(accessTokenKey, accessToken);
  if (refreshToken) writeStorage(refreshTokenKey, refreshToken);
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
  removeStorage(accessTokenKey);
  removeStorage(refreshTokenKey);
  removeStorage(userSessionKey);
}

function apiBaseUrl() {
  return (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
}

async function executeJsonRequest(path, payload, { method = 'POST', signal, auth = false, expectedStatus } = {}) {
  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  let hasTimedOut = false;
  const timeout = setTimeout(() => {
    hasTimedOut = true;
    controller.abort();
  }, 15000);
  signal?.addEventListener('abort', abortRequest, { once: true });
  if (signal?.aborted) abortRequest();

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (auth) {
    const accessToken = getAccessToken();
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`${apiBaseUrl()}/${path.replace(/^\/+/, '')}`, {
      method,
      headers,
      credentials: 'include',
      signal: controller.signal,
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiRequestError(
        typeof body?.message === 'string' && body.message.trim()
          ? body.message
          : 'No se pudo completar la solicitud. Intentá nuevamente.',
        response.status,
        typeof body?.code === 'string' ? body.code : undefined,
      );
    }
    if (body === null) {
      throw new ApiRequestError('El servidor devolvió una respuesta inesperada.', response.status);
    }
    if (expectedStatus && response.status !== expectedStatus) {
      throw new ApiRequestError('El servidor devolvió una respuesta inesperada.', response.status);
    }
    return body;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (hasTimedOut) throw new ApiRequestError('El servidor tardó demasiado en responder. Intentá nuevamente.');
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError('No se pudo conectar con el servidor. Revisá tu conexión e intentá nuevamente.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortRequest);
  }
}

async function renewSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const body = await executeJsonRequest('/auth/refresh', { refreshToken });
    if (typeof body?.accessToken !== 'string' || typeof body?.refreshToken !== 'string') return false;
    storeAuthTokens({ accessToken: body.accessToken, refreshToken: body.refreshToken });
    storeUserSession(body.user);
    return true;
  } catch {
    clearAuthTokens();
    return false;
  }
}

export async function sendJsonPostRequest(path, payload, { signal, expectedStatus, auth = false } = {}) {
  try {
    return await executeJsonRequest(path, payload, { signal, auth, expectedStatus });
  } catch (error) {
    // Reintento único con refresh ante una sesión expirada en llamadas autenticadas.
    if (auth && error instanceof ApiRequestError && error.status === 401 && error.errorCode === 'INVALID_SESSION') {
      if (await renewSession()) {
        return executeJsonRequest(path, payload, { signal, auth: true, expectedStatus });
      }
    }
    throw error;
  }
}

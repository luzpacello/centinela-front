import { getAccessToken, getRefreshToken, storeAuthTokens } from '@/storage/tokenStorage';

export const API_FORBIDDEN_EVENT = 'centinela:api-forbidden';
export const API_UNAUTHORIZED_EVENT = 'centinela:api-unauthorized';

export interface ApiErrorEventDetail {
  errorCode?: string;
  message: string;
  status: number;
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload?: unknown;
  signal?: AbortSignal;
  bearer?: string;
  expectedStatus?: number;
}

interface ParsedResponse {
  body: unknown;
  response: Response;
}

export class ApiRequestError extends Error {
  status: number;
  errorCode?: string;

  constructor(message: string, status = 0, errorCode?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

function getApiBaseUrl(): string {
  return (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
}

function readStoredAccessToken(): string | null {
  return typeof window === 'undefined' ? null : getAccessToken();
}

function emitApiEvent(name: string, detail: ApiErrorEventDetail): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

function getErrorFromResponse(response: Response, body: unknown): ApiRequestError {
  const errorBody = typeof body === 'object' && body !== null
    ? body as Record<string, unknown>
    : {};
  const message = typeof errorBody.message === 'string' && errorBody.message.trim()
    ? errorBody.message
    : 'No se pudo completar la solicitud. Intentá nuevamente.';
  const errorCode = typeof errorBody.errorCode === 'string'
    ? errorBody.errorCode
    : typeof errorBody.code === 'string'
      ? errorBody.code
      : undefined;

  return new ApiRequestError(message, response.status, errorCode);
}

async function performJsonRequest(
  path: string,
  { method = 'GET', payload, signal, bearer }: ApiRequestOptions,
): Promise<ParsedResponse> {
  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  let hasTimedOut = false;
  const timeout = globalThis.setTimeout(() => {
    hasTimedOut = true;
    controller.abort();
  }, 15000);

  signal?.addEventListener('abort', abortRequest, { once: true });
  if (signal?.aborted) abortRequest();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  // El token de acceso se inyecta para todas las llamadas; `bearer` permite
  // reemplazarlo por el JWT temporal que se usa durante el flujo de 2FA.
  const authorizationToken = bearer || readStoredAccessToken();
  if (authorizationToken) headers.Authorization = `Bearer ${authorizationToken}`;

  try {
    const response = await fetch(`${getApiBaseUrl()}/${path.replace(/^\/+/, '')}`, {
      method,
      headers,
      credentials: 'include',
      signal: controller.signal,
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const body: unknown = await response.json().catch(() => null);
    return { body, response };
  } catch (error) {
    if (signal?.aborted) throw error;
    if (hasTimedOut) {
      throw new ApiRequestError('El servidor tardó demasiado en responder. Intentá nuevamente.');
    }
    throw new ApiRequestError('No se pudo conectar con el servidor. Revisá tu conexión e intentá nuevamente.');
  } finally {
    globalThis.clearTimeout(timeout);
    signal?.removeEventListener('abort', abortRequest);
  }
}

async function tryToRenewSession(signal?: AbortSignal): Promise<boolean> {
  const refreshToken = typeof window === 'undefined' ? null : getRefreshToken();
  if (!refreshToken) return false;

  try {
    const { body, response } = await performJsonRequest('/auth/refresh', {
      method: 'POST',
      payload: { refreshToken },
      signal,
    });
    if (!response.ok || typeof body !== 'object' || body === null) return false;
    const tokens = body as Record<string, unknown>;
    if (typeof tokens.accessToken !== 'string' || typeof tokens.refreshToken !== 'string') return false;
    storeAuthTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return true;
  } catch {
    return false;
  }
}

function reportHttpError(error: ApiRequestError): void {
  const detail: ApiErrorEventDetail = {
    errorCode: error.errorCode,
    message: error.message,
    status: error.status,
  };

  if (error.status === 403) {
    emitApiEvent(API_FORBIDDEN_EVENT, detail);
  } else if (error.status === 401) {
    emitApiEvent(API_UNAUTHORIZED_EVENT, detail);
  }
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const usedStoredAccessToken = !options.bearer && Boolean(readStoredAccessToken());
  let result = await performJsonRequest(path, options);

  // Se intenta renovar una sola vez antes de invalidar una sesión autenticada.
  if (result.response.status === 401 && usedStoredAccessToken && path !== '/auth/refresh') {
    if (await tryToRenewSession(options.signal)) {
      result = await performJsonRequest(path, options);
    }
    options.signal?.throwIfAborted();
  }

  if (!result.response.ok) {
    const error = getErrorFromResponse(result.response, result.body);
    reportHttpError(error);
    throw error;
  }
  if (options.expectedStatus && result.response.status !== options.expectedStatus) {
    throw new ApiRequestError('El servidor devolvió una respuesta inesperada.', result.response.status);
  }
  if (result.response.status === 204) return null as T;
  if (result.body === null) {
    throw new ApiRequestError('El servidor devolvió una respuesta inesperada.', result.response.status);
  }
  return result.body as T;
}

export const apiClient = {
  get<T>(path: string, options: Omit<ApiRequestOptions, 'method' | 'payload'> = {}): Promise<T> {
    return request<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, payload: unknown, options: Omit<ApiRequestOptions, 'method' | 'payload'> = {}): Promise<T> {
    return request<T>(path, { ...options, method: 'POST', payload });
  },
  request,
};

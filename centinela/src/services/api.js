export class ApiRequestError extends Error {
  constructor(message, status = 0, errorCode = undefined) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

export async function sendJsonPostRequest(path, payload, { signal, expectedStatus } = {}) {
  const baseUrl = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
  const controller = new AbortController();
  const abortRequest = () => controller.abort();
  let hasTimedOut = false;
  const timeout = setTimeout(() => {
    hasTimedOut = true;
    controller.abort();
  }, 15000);
  signal?.addEventListener('abort', abortRequest, { once: true });
  if (signal?.aborted) abortRequest();

  try {
    const response = await fetch(`${baseUrl}/${path.replace(/^\/+/, '')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiRequestError(
        typeof body?.message === 'string' && body.message.trim()
          ? body.message
          : 'No se pudo completar la solicitud. Intentá nuevamente.',
        response.status,
        typeof body?.errorCode === 'string' ? body.errorCode : undefined,
      );
    }
    if (body === null || (expectedStatus && response.status !== expectedStatus)) {
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

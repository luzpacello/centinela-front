export class ApiRequestError extends Error {
  status: number;
  errorCode?: string;
  constructor(message: string, status?: number, errorCode?: string);
}

export function sendJsonPostRequest(
  path: string,
  payload: unknown,
  options?: { signal?: AbortSignal; expectedStatus?: number },
): Promise<unknown>;

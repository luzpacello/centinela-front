export class ApiRequestError extends Error {
  status: number;
  errorCode?: string;
  constructor(message: string, status?: number, errorCode?: string);
}

export interface StoredSessionUser {
  id: string;
  organizacionId: string;
  nombreCompleto: string;
  email: string;
  rol: string;
  instanciasPermitidas: number[];
  tiene2FA: boolean;
}

export function sendJsonPostRequest(
  path: string,
  payload: unknown,
  options?: { signal?: AbortSignal; expectedStatus?: number; auth?: boolean },
): Promise<unknown>;

export function getAccessToken(): string | null;
export function getRefreshToken(): string | null;
export function storeAuthTokens(tokens?: { accessToken?: string; refreshToken?: string }): void;
export function storeUserSession(user: StoredSessionUser): void;
export function getStoredUserSession(): StoredSessionUser | null;
export function clearAuthTokens(): void;

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
  options?: { signal?: AbortSignal; expectedStatus?: number; auth?: boolean; bearer?: string },
): Promise<unknown>;

// Lecturas autenticadas (por ejemplo GET /account/profile).
export function sendJsonGetRequest(
  path: string,
  options?: { signal?: AbortSignal; expectedStatus?: number; auth?: boolean; bearer?: string },
): Promise<unknown>;

export function getAccessToken(): string | null;
export function storeAuthTokens(tokens?: { accessToken?: string }): void;
export function storeUserSession(user: StoredSessionUser): void;
export function getStoredUserSession(): StoredSessionUser | null;
export function clearAuthTokens(): void;

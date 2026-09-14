import type {
  CreatedOrganization,
  LoginResponse,
  TwoFactorSetupResponse,
  UserSession,
} from '../types/authentication.ts';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isUserSession(value: unknown): value is UserSession {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id)
    && isNonEmptyString(value.organizacionId)
    && isNonEmptyString(value.nombreCompleto)
    && isNonEmptyString(value.email)
    && isNonEmptyString(value.rol)
    && Array.isArray(value.instanciasPermitidas)
    && value.instanciasPermitidas.every((instanceId) => typeof instanceId === 'number')
    && typeof value.tiene2FA === 'boolean';
}

// Shape de /auth/login, /auth/2fa/verify y /auth/refresh.
export function isLoginResponse(value: unknown): value is LoginResponse {
  if (!isRecord(value) || value.success !== true || !isUserSession(value.user)) return false;
  if (typeof value.requiresTwoFactor !== 'boolean' || typeof value.requiresTwoFactorSetup !== 'boolean') return false;
  if (typeof value.recordarSesion !== 'boolean') return false;
  if (!isOptionalString(value.challengeToken) || !isOptionalString(value.accessToken) || !isOptionalString(value.refreshToken)) return false;
  if (!isOptionalString(value.challengeExpiresAt) || !isOptionalString(value.accessExpiresAt) || !isOptionalString(value.refreshExpiresAt)) return false;
  // Para continuar el flujo debe existir un challenge (2FA pendiente) o los tokens emitidos.
  return isNonEmptyString(value.challengeToken) || isNonEmptyString(value.accessToken);
}

// Shape de /auth/2fa/setup.
export function isTwoFactorSetupResponse(value: unknown): value is TwoFactorSetupResponse {
  if (!isRecord(value)) return false;
  if (!isNonEmptyString(value.secret) || !isNonEmptyString(value.challengeToken)) return false;
  if (!isNonEmptyString(value.otpAuthUrl) || !isNonEmptyString(value.expiresAt)) return false;
  try {
    const setupUrl = new URL(value.otpAuthUrl);
    return setupUrl.protocol === 'otpauth:' && setupUrl.hostname === 'totp';
  } catch {
    return false;
  }
}

export function isCreatedOrganization(value: unknown): value is CreatedOrganization {
  if (!isRecord(value) || !isRecord(value.adminUser)) return false;
  const administrator = value.adminUser;
  return isNonEmptyString(value.id) && isNonEmptyString(value.name)
    && isNonEmptyString(value.createdAt) && !Number.isNaN(Date.parse(value.createdAt))
    && ['id', 'fullName', 'username', 'email'].every((field) => isNonEmptyString(administrator[field]))
    && administrator.role === 'ADMIN' && typeof administrator.isActive === 'boolean';
}

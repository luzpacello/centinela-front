import type {
  CreatedOrganization,
  LoginResponse,
  PerfilResponse,
  TokenResponse,
  TwoFactorQrResponse,
  UserSession,
} from '../types/authentication.ts';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// Contrato real de POST /auth/login.
export function isLoginResponse(value: unknown): value is LoginResponse {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.jwtTemporal)
    && typeof value.totpVinculado === 'boolean'
    && typeof value.cambioContrasenaRequerido === 'boolean';
}

// Contrato real de GET /auth/2fa/qr.
export function isTwoFactorQrResponse(value: unknown): value is TwoFactorQrResponse {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.qrBase64) && isNonEmptyString(value.secretoManual);
}

// Contrato real de POST /auth/2fa/verify y POST /auth/refresh.
export function isTokenResponse(value: unknown): value is TokenResponse {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.accessToken)
    && typeof value.expiresIn === 'number';
}

// Contrato real de GET /account/profile.
export function isPerfilResponse(value: unknown): value is PerfilResponse {
  if (!isRecord(value)) return false;
  const instancias = value.instanciasPermitidas;
  return isNonEmptyString(value.id)
    && isNonEmptyString(value.organizacionId)
    && isNonEmptyString(value.nombreCompleto)
    && isNonEmptyString(value.emailUsuario)
    && isNonEmptyString(value.rol)
    && typeof value.totpVinculado === 'boolean'
    && (instancias === null || (Array.isArray(instancias) && instancias.every((v) => typeof v === 'number')));
}

// Traduce el perfil del backend a la sesión que usa la aplicación.
export function mapPerfilToUserSession(perfil: PerfilResponse): UserSession {
  return {
    id: perfil.id,
    organizacionId: perfil.organizacionId,
    nombreCompleto: perfil.nombreCompleto,
    email: perfil.emailUsuario,
    rol: perfil.rol,
    instanciasPermitidas: perfil.instanciasPermitidas ?? [],
    tiene2FA: perfil.totpVinculado,
  };
}

export function isCreatedOrganization(value: unknown): value is CreatedOrganization {
  if (!isRecord(value) || !isRecord(value.adminUser)) return false;
  const administrator = value.adminUser;
  return isNonEmptyString(value.id) && isNonEmptyString(value.name)
    && isNonEmptyString(value.createdAt) && !Number.isNaN(Date.parse(value.createdAt))
    && ['id', 'fullName', 'username', 'email'].every((field) => isNonEmptyString(administrator[field]))
    && administrator.role === 'ADMIN' && typeof administrator.isActive === 'boolean';
}

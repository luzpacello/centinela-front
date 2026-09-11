import type { CreatedOrganization, LoginResponse } from '../types/authentication.ts';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isLoginResponse(value: unknown): value is LoginResponse {
  if (!isRecord(value) || !isNonEmptyString(value.tempSessionId)) return false;
  if (value.require2faInput === true && value.require2faSetup === false) return true;
  if (value.require2faSetup !== true || value.require2faInput !== false || !isRecord(value.totpSetup)) return false;
  if (!isNonEmptyString(value.totpSetup.secret) || !isNonEmptyString(value.totpSetup.qrCodeUrl)) return false;
  try {
    const setupUrl = new URL(value.totpSetup.qrCodeUrl);
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

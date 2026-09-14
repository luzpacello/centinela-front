import { ApiRequestError, sendJsonPostRequest } from '@/services/api';
import type { LoginResponse, TwoFactorSetupResponse } from '@/components/features/auth/types/authentication';
import { isLoginResponse, isTwoFactorSetupResponse } from '@/components/features/auth/utils/validateAuthenticationResponses';

// Implementación real contra el backend El Centinela (sin mocks).
export const twoFactorService = {
  // POST /auth/2fa/setup — inicia la vinculación y devuelve el otpAuthUrl para el QR.
  async setup(challengeToken: string, signal?: AbortSignal): Promise<TwoFactorSetupResponse> {
    const body = await sendJsonPostRequest('/auth/2fa/setup', { challengeToken }, { signal, expectedStatus: 200 });
    if (!isTwoFactorSetupResponse(body)) {
      throw new ApiRequestError('No se pudo interpretar la configuración de dos factores.');
    }
    return body;
  },

  // POST /auth/2fa/verify — confirma el código TOTP y devuelve la sesión con tokens.
  async verify(challengeToken: string, code: string, signal?: AbortSignal): Promise<LoginResponse> {
    const body = await sendJsonPostRequest('/auth/2fa/verify', { challengeToken, code }, { signal, expectedStatus: 200 });
    if (!isLoginResponse(body)) {
      throw new ApiRequestError('No se pudo interpretar la verificación de dos factores.');
    }
    return body;
  },
};

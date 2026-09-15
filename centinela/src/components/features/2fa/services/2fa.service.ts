import { ApiRequestError, sendJsonGetRequest, sendJsonPostRequest } from '@/services/api';
import type { TokenResponse, TwoFactorQrResponse } from '@/components/features/auth/types/authentication';
import { isTokenResponse, isTwoFactorQrResponse } from '@/components/features/auth/utils/validateAuthenticationResponses';

// Implementación real contra el backend El Centinela (sin mocks).
// Durante todo el flujo 2FA la identidad viaja en la cabecera con el jwtTemporal
// que devolvió el login.
export const twoFactorService = {
  // GET /auth/2fa/qr — genera el secreto y devuelve el QR (imagen en base64) y el
  // secreto manual para ingreso alternativo.
  async qr(jwtTemporal: string, signal?: AbortSignal): Promise<TwoFactorQrResponse> {
    const body = await sendJsonGetRequest('/auth/2fa/qr', { signal, bearer: jwtTemporal, expectedStatus: 200 });
    if (!isTwoFactorQrResponse(body)) {
      throw new ApiRequestError('No se pudo interpretar la configuración de dos factores.');
    }
    return body;
  },

  // POST /auth/2fa/verify — confirma el código TOTP y devuelve los tokens de sesión.
  async verify(jwtTemporal: string, codigo: string, signal?: AbortSignal): Promise<TokenResponse> {
    const body = await sendJsonPostRequest('/auth/2fa/verify', { codigo }, { signal, bearer: jwtTemporal, expectedStatus: 200 });
    if (!isTokenResponse(body)) {
      throw new ApiRequestError('No se pudo interpretar la verificación de dos factores.');
    }
    return body;
  },
};

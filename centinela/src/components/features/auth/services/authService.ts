import { ApiRequestError, sendJsonPostRequest } from '../../../../services/api.js';
import type { LoginCredentials, LoginResponse } from '../types/authentication.ts';
import { isLoginResponse } from '../utils/validateAuthenticationResponses.ts';

export async function submitLoginCredentials(credentials: LoginCredentials, signal?: AbortSignal): Promise<LoginResponse> {
  const response = await sendJsonPostRequest('/auth/login', {
    email: credentials.email.trim(),
    password: credentials.password,
    rememberMe: credentials.rememberMe,
  }, { signal, expectedStatus: 200 });
  
  if (!isLoginResponse(response)) {
    throw new ApiRequestError('La respuesta del servidor no permite continuar con la autenticación de dos factores.');
  }
  return response;
}

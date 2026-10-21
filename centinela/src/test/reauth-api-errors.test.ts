import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_SESSION_EXPIRED_EVENT, apiClient, ApiRequestError } from '@/services/apiClient';

describe('reauthentication API failures', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it.each(['AUTH_FAILED', 'INVALID_OTP_CODE'])('keeps the session active for %s', async (errorCode) => {
    window.sessionStorage.setItem('centinela_access', 'access-token');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      message: 'Unauthorized',
      errorCode,
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const onSessionExpired = vi.fn();
    window.addEventListener(API_SESSION_EXPIRED_EVENT, onSessionExpired);

    try {
      await expect(apiClient.request('/account/profile', {
        method: 'PUT',
        payload: { emailUsuario: 'nuevo@example.com' },
        preserveSessionOnReauthFailure: true,
      })).rejects.toMatchObject(new ApiRequestError('Unauthorized', 401, errorCode));

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(onSessionExpired).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(API_SESSION_EXPIRED_EVENT, onSessionExpired);
    }
  });

  it('accepts a successful 200 response with no body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    await expect(apiClient.request('/account/profile', {
      method: 'PUT',
      expectedStatus: 200,
      allowEmptyResponse: true,
    })).resolves.toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/services/apiClient';
import { clearAuthTokens, storeAuthTokens } from '@/storage/tokenStorage';

describe('session security', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('renews an invalid access token using cookies and retries without sending a refresh token', async () => {
    storeAuthTokens({ accessToken: 'old-access' });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ errorCode: 'INVALID_TOKEN' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'new-access' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.get('/node/status')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const calls = fetchMock.mock.calls;
    for (const [, options] of calls) expect(options.credentials).toBe('include');
    expect(calls[1][0]).toBe('/api/auth/refresh');
    expect(calls[1][1].method).toBe('POST');
    expect(calls[1][1].body).toBeUndefined();
    expect(calls[2][1].headers.Authorization).toBe('Bearer new-access');
    expect(window.sessionStorage.getItem('centinela_access')).toBe('new-access');
    expect(window.sessionStorage.getItem('centinela_refresh')).toBeNull();
  });

  it('removes a legacy refresh token when the session is cleared', () => {
    window.sessionStorage.setItem('centinela_refresh', 'legacy');
    clearAuthTokens();
    expect(window.sessionStorage.getItem('centinela_refresh')).toBeNull();
  });
});

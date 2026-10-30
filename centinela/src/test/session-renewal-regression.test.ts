import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiRequestError, API_SESSION_EXPIRED_EVENT, API_UNAUTHORIZED_EVENT } from '@/services/apiClient';
import { clearAuthTokens, getAccessToken, storeAuthTokens } from '@/storage/tokenStorage';

type Call = [string, RequestInit];

function installFetch(handler: (url: string, init: RequestInit) => Promise<Response>) {
  const calls: Call[] = [];
  const mock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    calls.push([String(input), init]);
    return handler(String(input), init);
  });
  vi.stubGlobal('fetch', mock);
  return calls;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

afterEach(() => {
  window.sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('probe: real backend error code INVALID_TOKEN drives cookie renewal', () => {
  it('P8 renews with credentials include and no request body, then retries with the new bearer', async () => {
    storeAuthTokens({ accessToken: 'old-access' });
    const calls = installFetch(async (url, init) => {
      if (url === '/api/auth/refresh') return json({ accessToken: 'new-access', expiresIn: 900 });
      if (!String((init.headers as Record<string, string>).Authorization).includes('new-access')) {
        return json({ errorCode: 'INVALID_TOKEN', message: 'Identificador de usuario inválido.' }, 401);
      }
      return json({ ok: true });
    });

    await expect(apiClient.get('/node/status')).resolves.toEqual({ ok: true });
    expect(calls).toHaveLength(3);
    expect(calls[0][0]).toBe('/api/node/status');
    expect(calls[1][0]).toBe('/api/auth/refresh');
    expect(calls[1][1].method).toBe('POST');
    expect(calls[1][1].credentials).toBe('include');
    expect(calls[1][1].body).toBeUndefined();
    expect(calls[1][1].headers).not.toHaveProperty('Content-Type');
    expect((calls[2][1].headers as Record<string, string>).Authorization).toBe('Bearer new-access');
    expect(getAccessToken()).toBe('new-access');
    expect(window.sessionStorage.getItem('centinela_refresh')).toBeNull();
  });

  it('P9 shares a single refresh across concurrent 401s', async () => {
    storeAuthTokens({ accessToken: 'old-access' });
    let refreshes = 0;
    const calls = installFetch(async (url, init) => {
      if (url === '/api/auth/refresh') {
        refreshes += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return json({ accessToken: 'new-access', expiresIn: 900 });
      }
      const auth = String((init.headers as Record<string, string>).Authorization);
      return auth === 'Bearer new-access' ? json({ path: url }) : json({ errorCode: 'INVALID_TOKEN' }, 401);
    });
    const [a, b] = await Promise.all([apiClient.get('/a'), apiClient.get('/b')]);
    expect(a).toEqual({ path: '/api/a' });
    expect(b).toEqual({ path: '/api/b' });
    expect(refreshes).toBe(1);
    expect(calls.filter(([url]) => url === '/api/auth/refresh')).toHaveLength(1);
  });

  it('P10 does not renew on TOKEN_REVOKED and signals an unauthorized session', async () => {
    storeAuthTokens({ accessToken: 'old-access' });
    const calls = installFetch(async () => json({ errorCode: 'TOKEN_REVOKED' }, 401));
    const unauthorized = vi.fn();
    window.addEventListener(API_UNAUTHORIZED_EVENT, unauthorized);
    await expect(apiClient.get('/node/status')).rejects.toMatchObject({ status: 401, errorCode: 'TOKEN_REVOKED' });
    expect(calls.filter(([url]) => url === '/api/auth/refresh')).toHaveLength(0);
    expect(unauthorized).toHaveBeenCalledTimes(1);
    window.removeEventListener(API_UNAUTHORIZED_EVENT, unauthorized);
  });

  it('P11 keeps the stored session byte-identical when the refresh response is malformed', async () => {
    storeAuthTokens({ accessToken: 'old-access' });
    window.sessionStorage.setItem('centinela_user', '{"id":"u1"}');
    const before = JSON.stringify({ ...window.sessionStorage });
    installFetch(async (url) => (url === '/api/auth/refresh' ? json({ expiresIn: 900 }) : json({ errorCode: 'INVALID_TOKEN' }, 401)));
    const expired = vi.fn();
    window.addEventListener(API_SESSION_EXPIRED_EVENT, expired);
    await expect(apiClient.get('/node/status')).rejects.toBeInstanceOf(ApiRequestError);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(JSON.stringify({ ...window.sessionStorage })).toBe(before);
    expect(getAccessToken()).toBe('old-access');
    window.removeEventListener(API_SESSION_EXPIRED_EVENT, expired);
  });

  it('P12 never loops when the refresh endpoint itself answers 401', async () => {
    storeAuthTokens({ accessToken: 'old-access' });
    const calls = installFetch(async (url) => (url === '/api/auth/refresh'
      ? json({ errorCode: 'REFRESH_FAILED' }, 401)
      : json({ errorCode: 'INVALID_TOKEN' }, 401)));
    await expect(apiClient.get('/node/status')).rejects.toMatchObject({ status: 401 });
    expect(calls.filter(([url]) => url === '/api/auth/refresh')).toHaveLength(1);
  });

  it('P13 clears only the legacy refresh key when the session is cleared, without creating it', () => {
    window.sessionStorage.setItem('centinela_refresh', 'legacy');
    window.sessionStorage.setItem('centinela_user', '{"id":"u1"}');
    storeAuthTokens({ accessToken: 'a' });
    clearAuthTokens();
    expect(window.sessionStorage.length).toBe(0);
  });
});

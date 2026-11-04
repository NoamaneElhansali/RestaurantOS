import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, csrfToken, identity } from '../lib/api';

afterEach(() => { vi.unstubAllGlobals(); });

describe('cookie-authenticated API client', () => {
  it('includes credentials on all requests and never persists bearer tokens', async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetcher = vi.fn(async (url: string, init: RequestInit) => {
      requests.push({ url, init });
      return new Response(JSON.stringify({ user: { id: 1, name: 'Test', email: 'test@example.test', email_verified: true, is_super_admin: false } }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetcher);
    const response = await identity.me();
    expect(response.user.id).toBe(1);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('/api/v1/auth/me');
    expect(requests[0].init.credentials).toBe('same-origin');
    expect((requests[0].init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('fetches a CSRF cookie and sends the decoded XSRF header before mutation', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token-test';
    expect(csrfToken()).toBe('csrf-token-test');
    const requests: Array<{ url: string; init: RequestInit }> = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      requests.push({ url, init });
      if (url === '/sanctum/csrf-cookie') return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ user: { id: 1 } }), { status: 200 });
    }));
    await identity.login('test@example.test', 'Password123');
    expect(requests.map((r) => r.url)).toEqual(['/sanctum/csrf-cookie', '/api/v1/auth/login']);
    expect((requests[1].init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('csrf-token-test');
    expect(requests[1].init.credentials).toBe('same-origin');
  });

  it('surfaces server-side field validation and rejects failed CSRF bootstrap', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === '/sanctum/csrf-cookie') return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ message: 'Invalid', errors: { email: ['Invalid email'] } }), { status: 422 });
    }));
    await expect(identity.login('bad', 'password')).rejects.toMatchObject({
      status: 422, errors: { email: ['Invalid email'] },
    });

    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 419 })));
    await expect(api('/auth/login', 'POST', {})).rejects.toBeInstanceOf(ApiError);
  });

  it('cannot be tricked into using an arbitrary API host', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    await api('/restaurants');
    expect(fetcher).toHaveBeenCalledWith('/api/v1/restaurants', expect.anything());
  });
});

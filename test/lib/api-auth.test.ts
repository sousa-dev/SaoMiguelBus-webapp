// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/features/account/auth-store';
import { fetchEntitlement, fetchMe, registerAccount } from '@/lib/api';
import { ApiRequestError, parseApiErrorBody } from '@/lib/api-errors';

const user = { id: 7, email: 'a@b.c', displayName: 'A', dateJoined: '2026-01-01', isSuperuser: false };

function respond(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

function sentHeaders(fetchMock: ReturnType<typeof vi.fn>): Record<string, string> {
  const init = fetchMock.mock.calls[0][1] as RequestInit;
  return init.headers as Record<string, string>;
}

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null, user: null, hydrated: true });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch auth headers', () => {
  it('sends no Authorization header while signed out, but always a session id', async () => {
    const fetchMock = respond(200, { tier: 'free' });
    vi.stubGlobal('fetch', fetchMock);
    await fetchEntitlement();
    const headers = sentHeaders(fetchMock);
    expect(headers.Authorization).toBeUndefined();
    expect(headers['X-Session-Id']).toBeTruthy();
    expect(headers['X-Island']).toBeTruthy();
  });

  it('sends the DRF token header when signed in', async () => {
    useAuthStore.setState({ token: 'tok123', user });
    const fetchMock = respond(200, user);
    vi.stubGlobal('fetch', fetchMock);
    await fetchMe();
    expect(sentHeaders(fetchMock).Authorization).toBe('Token tok123');
  });

  it('clears the session on a 401 that carried a token', async () => {
    useAuthStore.setState({ token: 'stale', user });
    vi.stubGlobal('fetch', respond(401, { detail: 'Invalid token.' }));
    await expect(fetchMe()).rejects.toBeInstanceOf(ApiRequestError);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('leaves the store alone on a 401 without a token (a failed login)', async () => {
    vi.stubGlobal(
      'fetch',
      respond(401, { error: { code: 'invalid_credentials', message: 'Nope' } }),
    );
    await expect(fetchMe()).rejects.toMatchObject({
      status: 401,
      parsed: { code: 'invalid_credentials', message: 'Nope' },
    });
    expect(useAuthStore.getState().hydrated).toBe(true);
  });

  it('posts register with the snake_case display name the API expects', async () => {
    const fetchMock = respond(201, { token: 't', user });
    vi.stubGlobal('fetch', fetchMock);
    await registerAccount({ email: 'a@b.c', password: 'pw', displayName: 'A' });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'a@b.c',
      password: 'pw',
      display_name: 'A',
    });
  });
});

describe('parseApiErrorBody', () => {
  it('reads the v3 error envelope', () => {
    expect(parseApiErrorBody('{"error":{"code":"email_taken","message":"Taken"}}')).toEqual({
      code: 'email_taken',
      message: 'Taken',
    });
  });

  it('turns DRF field errors into a validation error on the first field', () => {
    expect(parseApiErrorBody('{"password":["Too short"],"email":["Bad"]}')).toEqual({
      code: 'validation_error',
      message: 'Too short',
      field: 'password',
    });
  });

  it('falls back to unknown with a trimmed body for non-JSON', () => {
    expect(parseApiErrorBody('  <html>502</html> ')).toEqual({
      code: 'unknown',
      message: '<html>502</html>',
    });
    expect(parseApiErrorBody('')).toEqual({ code: 'unknown', message: undefined });
  });
});

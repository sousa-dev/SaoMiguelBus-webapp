// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchMe } = vi.hoisted(() => ({ fetchMe: vi.fn() }));
vi.mock('@/lib/api', () => ({ fetchMe }));

import { getAuthToken, isSignedIn, useAuthStore } from '@/features/account/auth-store';
import { ApiRequestError } from '@/lib/api-errors';

const user = { id: 7, email: 'a@b.c', displayName: 'A', dateJoined: '2026-01-01', isSuperuser: false };

beforeEach(() => {
  localStorage.clear();
  fetchMe.mockReset();
  useAuthStore.setState({ token: null, user: null, hydrated: true });
});

describe('auth store', () => {
  it('persists token and user under azores_hub_auth', () => {
    useAuthStore.getState().setSession('tok', user);
    expect(getAuthToken()).toBe('tok');
    expect(isSignedIn()).toBe(true);
    const raw = JSON.parse(localStorage.getItem('azores_hub_auth')!);
    expect(raw.state).toEqual({ token: 'tok', user });
  });

  it('clears everything on clearSession', () => {
    useAuthStore.getState().setSession('tok', user);
    useAuthStore.getState().clearSession();
    expect(isSignedIn()).toBe(false);
    expect(JSON.parse(localStorage.getItem('azores_hub_auth')!).state).toEqual({
      token: null,
      user: null,
    });
  });

  it('refreshUser updates the profile from /auth/me', async () => {
    useAuthStore.getState().setSession('tok', user);
    fetchMe.mockResolvedValue({ ...user, displayName: 'Renamed', isSuperuser: true });
    await useAuthStore.getState().refreshUser();
    expect(useAuthStore.getState().user?.displayName).toBe('Renamed');
    expect(useAuthStore.getState().user?.isSuperuser).toBe(true);
  });

  it('refreshUser keeps the session on a network error', async () => {
    useAuthStore.getState().setSession('tok', user);
    fetchMe.mockRejectedValue(new TypeError('Failed to fetch'));
    await useAuthStore.getState().refreshUser();
    expect(getAuthToken()).toBe('tok');
  });

  it('refreshUser drops the session on 401', async () => {
    useAuthStore.getState().setSession('tok', user);
    fetchMe.mockRejectedValue(new ApiRequestError(401, '', { code: 'unknown' }));
    await useAuthStore.getState().refreshUser();
    expect(getAuthToken()).toBeNull();
  });

  it('refreshUser is a no-op while signed out', async () => {
    await useAuthStore.getState().refreshUser();
    expect(fetchMe).not.toHaveBeenCalled();
  });
});

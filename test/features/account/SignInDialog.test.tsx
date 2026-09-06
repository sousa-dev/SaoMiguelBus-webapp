// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
  fetchMe: vi.fn(),
  logoutAccount: vi.fn(),
  deleteAccount: vi.fn(),
  fetchEntitlement: vi.fn(),
}));
vi.mock('@/lib/api', () => api);

import { useAuthStore } from '@/features/account/auth-store';
import { SignInDialogHost } from '@/features/account/components/SignInDialogHost';
import { openSignInDialog, useSignInDialogStore } from '@/features/account/lib/sign-in-dialog-store';
import { ApiRequestError } from '@/lib/api-errors';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

const user = { id: 7, email: 'a@b.c', displayName: 'A', dateJoined: '2026-01-01', isSuperuser: false };
let mounted: Mounted | null = null;

function dialog(): HTMLElement | null {
  return document.body.querySelector('[role="dialog"]');
}

function input(label: string): HTMLInputElement {
  const el = dialog()!.querySelector<HTMLInputElement>(`input[name="${label}"]`);
  if (!el) throw new Error(`no input ${label}`);
  return el;
}

async function type(el: HTMLInputElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function submit() {
  await act(async () => {
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  for (let i = 0; i < 3; i++) await flush();
}

beforeEach(async () => {
  localStorage.clear();
  Object.values(api).forEach((fn) => fn.mockReset());
  api.fetchMe.mockResolvedValue(user);
  useAuthStore.setState({ token: null, user: null, hydrated: true });
  useSignInDialogStore.getState().close();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <SignInDialogHost />
    </QueryClientProvider>,
  );
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('SignInDialog', () => {
  it('stays closed until opened through the store', () => {
    expect(dialog()).toBeNull();
  });

  it('opens in login mode with email and password, and register mode adds the name', async () => {
    await act(async () => {
      openSignInDialog({ reason: 'test' });
    });
    expect(dialog()).not.toBeNull();
    expect(input('email')).toBeTruthy();
    expect(input('password')).toBeTruthy();
    expect(dialog()!.querySelector('input[name="displayName"]')).toBeNull();

    const registerTab = Array.from(dialog()!.querySelectorAll('button')).find(
      (b) => b.textContent === 'Create account',
    )!;
    await act(async () => {
      registerTab.click();
    });
    expect(dialog()!.querySelector('input[name="displayName"]')).not.toBeNull();
  });

  it('logs in, stores the session, runs onSuccess and closes', async () => {
    const onSuccess = vi.fn();
    api.loginAccount.mockResolvedValue({ token: 'tok', user });
    await act(async () => {
      openSignInDialog({ reason: 'test', prefillEmail: 'a@b.c', onSuccess });
    });
    expect(input('email').value).toBe('a@b.c');
    await type(input('password'), 'secret');
    await submit();

    // TanStack Query v5 passes a mutation context as the second argument.
    expect(api.loginAccount.mock.calls[0][0]).toEqual({ email: 'a@b.c', password: 'secret' });
    expect(useAuthStore.getState().token).toBe('tok');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(dialog()).toBeNull();
  });

  it('registers with the display name', async () => {
    api.registerAccount.mockResolvedValue({ token: 'tok', user });
    await act(async () => {
      openSignInDialog({ reason: 'test', mode: 'register' });
    });
    await type(input('email'), 'new@b.c');
    await type(input('password'), 'secret12');
    await type(input('displayName'), 'New');
    await submit();
    expect(api.registerAccount.mock.calls[0][0]).toEqual({
      email: 'new@b.c',
      password: 'secret12',
      displayName: 'New',
    });
    expect(useAuthStore.getState().token).toBe('tok');
  });

  it('shows the mapped error on the right field and stays open', async () => {
    api.loginAccount.mockRejectedValue(
      new ApiRequestError(401, '', { code: 'invalid_credentials', message: 'Nope' }),
    );
    await act(async () => {
      openSignInDialog({ reason: 'test' });
    });
    await type(input('email'), 'a@b.c');
    await type(input('password'), 'wrong');
    await submit();
    expect(dialog()).not.toBeNull();
    expect(dialog()!.textContent).toContain('Incorrect email or password.');
    expect(input('password').getAttribute('aria-invalid')).toBe('true');
    expect(useAuthStore.getState().token).toBeNull();
  });
});

// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
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
import { AccountSection } from '@/features/account/components/AccountSection';
import { useSignInDialogStore } from '@/features/account/lib/sign-in-dialog-store';
import { setPremiumForTests } from '@/features/premium/usePremium';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

const user = { id: 7, email: 'a@b.c', displayName: 'Ana', dateJoined: '2026-01-01', isSuperuser: false };
let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AccountSection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return mounted;
}

function button(text: string): HTMLButtonElement {
  const el = Array.from(document.body.querySelectorAll('button')).find((b) =>
    b.textContent?.includes(text),
  );
  if (!el) throw new Error(`no button ${text}`);
  return el as HTMLButtonElement;
}

beforeEach(() => {
  localStorage.clear();
  Object.values(api).forEach((fn) => fn.mockReset());
  api.logoutAccount.mockResolvedValue(undefined);
  api.deleteAccount.mockResolvedValue(undefined);
  useAuthStore.setState({ token: null, user: null, hydrated: true });
  useSignInDialogStore.getState().close();
  setPremiumForTests(null);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('AccountSection', () => {
  it('offers sign-in while signed out and opens the dialog store', async () => {
    const m = await render();
    expect(m.container.textContent).toContain('Sign in');
    await act(async () => {
      button('Sign in').click();
    });
    expect(useSignInDialogStore.getState().open).toBe(true);
  });

  it('shows the profile and premium badge while signed in', async () => {
    useAuthStore.setState({ token: 'tok', user });
    setPremiumForTests({
      tier: 'premium',
      source: 'revenuecat',
      status: 'active',
      currentPeriodEnd: null,
      features: [],
      manageVia: 'web',
    });
    const m = await render();
    expect(m.container.textContent).toContain('Ana');
    expect(m.container.textContent).toContain('a@b.c');
    expect(m.container.querySelector('[data-testid="premium-badge"]')).not.toBeNull();
  });

  it('signs out', async () => {
    useAuthStore.setState({ token: 'tok', user });
    await render();
    await act(async () => {
      button('Sign out').click();
    });
    for (let i = 0; i < 3; i++) await flush();
    expect(api.logoutAccount).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('deletes the account only after confirmation', async () => {
    useAuthStore.setState({ token: 'tok', user });
    await render();
    await act(async () => {
      button('Delete account').click();
    });
    expect(api.deleteAccount).not.toHaveBeenCalled();
    const confirm = document.body.querySelector('[role="dialog"]')!;
    expect(confirm).not.toBeNull();
    const confirmButton = Array.from(confirm.querySelectorAll('button')).find(
      (b) => b.textContent === 'Delete',
    )!;
    await act(async () => {
      confirmButton.click();
    });
    for (let i = 0; i < 3; i++) await flush();
    expect(api.deleteAccount).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().token).toBeNull();
  });
});

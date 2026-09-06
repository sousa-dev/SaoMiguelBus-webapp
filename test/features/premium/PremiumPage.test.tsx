// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ track }));

const api = vi.hoisted(() => ({
  fetchEntitlement: vi.fn(),
  fetchMe: vi.fn(),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
  registerGuestAccount: vi.fn(),
  setPassword: vi.fn(),
  logoutAccount: vi.fn(),
  deleteAccount: vi.fn(),
}));
vi.mock('@/lib/api', () => api);

const rc = vi.hoisted(() => ({
  ensureRevenueCat: vi.fn(async () => ({})),
  ensureRevenueCatAnonymous: vi.fn(async () => ({})),
  closeRevenueCat: vi.fn(),
  getWebOfferings: vi.fn(),
  purchaseWebPackage: vi.fn(),
  getWebCustomerInfo: vi.fn(async () => null),
  isRevenueCatConfigured: vi.fn(() => true),
  isRevenueCatSandbox: vi.fn(() => true),
  revenueCatEntitlementId: vi.fn(() => 'Sao Miguel Hub Premium'),
}));
vi.mock('@/features/premium/lib/revenuecat-web', () => rc);

import { useAuthStore } from '@/features/account/auth-store';
import { useSignInDialogStore } from '@/features/account/lib/sign-in-dialog-store';
import { useEntitlementStore } from '@/features/premium/entitlement-store';
import { PremiumPage } from '@/features/premium/PremiumPage';
import { setPremiumForTests, usePremium } from '@/features/premium/usePremium';
import i18n from '@/lib/i18n';
import { flush, mount, type Mounted } from '../../helpers/react';

await i18n.changeLanguage('en');

const user = { id: 7, email: 'a@b.c', displayName: 'Ana', dateJoined: '2026-01-01' };
const monthly = {
  identifier: '$rc_monthly',
  packageType: '$rc_monthly',
  webBillingProduct: {
    identifier: 'premium_monthly',
    currentPrice: { formattedPrice: '€2.99', amount: 2.99, amountMicros: 2_990_000, currency: 'EUR' },
    normalPeriodDuration: 'P1M',
    period: { number: 1, unit: 'month' },
    freeTrialPhase: { period: { number: 3, unit: 'day' } },
  },
};
const annual = {
  ...monthly,
  identifier: '$rc_annual',
  packageType: '$rc_annual',
  webBillingProduct: {
    ...monthly.webBillingProduct,
    identifier: 'premium_annual',
    currentPrice: { ...monthly.webBillingProduct.currentPrice, formattedPrice: '€19.99' },
    normalPeriodDuration: 'P1Y',
    period: { number: 1, unit: 'year' },
    freeTrialPhase: null,
  },
};
const offering = { identifier: 'default', availablePackages: [annual, monthly] };
const premiumInfo = {
  managementURL: 'https://portal.example',
  entitlements: {
    active: {
      'Sao Miguel Hub Premium': {
        isActive: true,
        willRenew: true,
        expirationDate: new Date('2027-01-01T00:00:00.000Z'),
        store: 'rc_billing',
      },
    },
    all: {},
  },
  nonSubscriptionTransactions: [],
};

let mounted: Mounted | null = null;

function PremiumProbe() {
  return <span data-testid="is-premium">{String(usePremium())}</span>;
}

async function render(path = '/premium?source=test') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <PremiumPage />
        <PremiumProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  for (let i = 0; i < 4; i++) {
    await flush();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
  return mounted;
}

function buttons(): HTMLButtonElement[] {
  return Array.from(mounted!.container.querySelectorAll('button'));
}

function setInputValue(el: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  track.mockClear();
  Object.values(rc).forEach((fn) => fn.mockClear());
  api.registerGuestAccount.mockReset();
  api.setPassword.mockReset();
  rc.getWebOfferings.mockResolvedValue(offering);
  rc.purchaseWebPackage.mockResolvedValue(premiumInfo);
  useAuthStore.setState({ token: null, user: null, hydrated: true });
  useEntitlementStore.getState().clearEntitlement();
  setPremiumForTests(null);
  useSignInDialogStore.getState().close();
  vi.stubGlobal('open', vi.fn());
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
  vi.unstubAllGlobals();
});

describe('PremiumPage', () => {
  it('shows tiles for every package, defaulting to the one with a free trial', async () => {
    useAuthStore.setState({ token: 'tok', user });
    const m = await render();
    const text = m.container.textContent ?? '';
    expect(text).toContain('Pin favorite routes');
    expect(text).toContain('only available in the mobile app');
    expect(text).toContain('€2.99');
    expect(text).toContain('€19.99');
    expect(text).toContain('3 day free trial');
    expect(track).toHaveBeenCalledWith('billing', 'paywall_open', expect.objectContaining({ source: 'test', offering_id: 'default' }));

    // The trial package tile carries the selected marker (aria via a checkmark span — assert via class).
    const monthlyTile = buttons().find((b) => b.textContent?.includes('3 day free trial'))!;
    expect(monthlyTile.className).toContain('border-primary');
  });

  it('asks anonymous visitors for an email, creates a guest account, then purchases', async () => {
    const guestUser = { ...user, email: 'guest@x.com' };
    api.registerGuestAccount.mockResolvedValue({ token: 'newtok', user: guestUser });
    api.fetchMe.mockResolvedValue(guestUser);
    const m = await render();
    const continueBtn = buttons().find((b) => b.textContent === 'Continue')!;
    await act(async () => {
      continueBtn.click();
    });
    expect(rc.purchaseWebPackage).not.toHaveBeenCalled();

    const dialog = document.body.querySelector('[role="dialog"]')!;
    const emailInput = dialog.querySelector('input[type="email"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(emailInput, 'guest@x.com');
    });
    const submit = Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Continue')!;
    await act(async () => {
      submit.click();
    });
    for (let i = 0; i < 4; i++) await flush();

    expect(api.registerGuestAccount.mock.calls[0][0]).toEqual({ email: 'guest@x.com' });
    expect(rc.purchaseWebPackage).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().token).toBe('newtok');

    // Purchase succeeded for a freshly-created guest account: prompt to set a password.
    const passwordDialog = document.body.querySelector('[role="dialog"]');
    expect(passwordDialog?.textContent).toContain('Set your password');
    expect(m.container.querySelector('[data-testid="is-premium"]')!.textContent).toBe('true');
  });

  it('falls back to sign-in when the guest email already has an account', async () => {
    const { ApiRequestError } = await import('@/lib/api-errors');
    api.registerGuestAccount.mockRejectedValue(
      new ApiRequestError(400, '', { code: 'email_taken', message: 'taken' }),
    );
    await render();
    const continueBtn = buttons().find((b) => b.textContent === 'Continue')!;
    await act(async () => {
      continueBtn.click();
    });
    const dialog = document.body.querySelector('[role="dialog"]')!;
    const emailInput = dialog.querySelector('input[type="email"]') as HTMLInputElement;
    await act(async () => {
      setInputValue(emailInput, 'existing@x.com');
    });
    const submit = Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Continue')!;
    await act(async () => {
      submit.click();
    });
    for (let i = 0; i < 4; i++) await flush();

    const signIn = useSignInDialogStore.getState();
    expect(signIn.open).toBe(true);
    expect(signIn.reason).toBe('purchase');
    expect(signIn.prefillEmail).toBe('existing@x.com');

    useAuthStore.setState({ token: 'tok', user });
    await act(async () => {
      signIn.onSuccess?.();
    });
    for (let i = 0; i < 4; i++) await flush();
    expect(rc.purchaseWebPackage).toHaveBeenCalledTimes(1);
  });

  it('purchases the selected tile for a signed-in user without any guest dialog', async () => {
    useAuthStore.setState({ token: 'tok', user });
    const m = await render();
    const annualTile = buttons().find((b) => b.textContent?.includes('€19.99'))!;
    await act(async () => {
      annualTile.click();
    });
    const continueBtn = buttons().find((b) => b.textContent === 'Continue')!;
    await act(async () => {
      continueBtn.click();
    });
    for (let i = 0; i < 4; i++) await flush();
    expect(api.registerGuestAccount).not.toHaveBeenCalled();
    expect(rc.purchaseWebPackage.mock.calls[0][0]).toMatchObject({ identifier: '$rc_annual' });
    expect(rc.purchaseWebPackage.mock.calls[0][1]).toBe('a@b.c');
    expect(m.container.querySelector('[data-testid="is-premium"]')!.textContent).toBe('true');
    expect(track).toHaveBeenCalledWith('billing', 'purchase_success', expect.objectContaining({ package_id: '$rc_annual' }));
    expect(m.container.textContent).toContain('Premium active');
  });

  it('shows the status card with manage and restore for premium users', async () => {
    useAuthStore.setState({ token: 'tok', user });
    setPremiumForTests({
      tier: 'premium',
      source: 'revenuecat',
      status: 'active',
      currentPeriodEnd: '2027-01-01T00:00:00.000Z',
      features: [],
      manageVia: 'web',
    });
    rc.getWebCustomerInfo.mockResolvedValue(premiumInfo);
    const m = await render();
    expect(m.container.textContent).toContain('Premium active');
    expect(buttons().some((b) => b.textContent === 'Continue')).toBe(false);
    const manage = buttons().find((b) => b.textContent?.includes('Manage subscription'))!;
    await act(async () => {
      manage.click();
    });
    for (let i = 0; i < 3; i++) await flush();
    expect(window.open).toHaveBeenCalledWith('https://portal.example', '_blank', 'noopener,noreferrer');
  });

  it('explains when no offering is configured', async () => {
    useAuthStore.setState({ token: 'tok', user });
    rc.getWebOfferings.mockResolvedValue(null);
    const m = await render();
    expect(m.container.textContent).toContain('not available right now');
    expect(buttons().some((b) => b.textContent === 'Continue')).toBe(false);
  });
});

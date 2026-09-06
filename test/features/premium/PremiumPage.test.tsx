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

beforeEach(() => {
  track.mockClear();
  Object.values(rc).forEach((fn) => fn.mockClear());
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
  it('lists the feature set, the mobile-only notice and the packages sorted monthly first', async () => {
    useAuthStore.setState({ token: 'tok', user });
    const m = await render();
    const text = m.container.textContent ?? '';
    expect(text).toContain('Pin favorite routes');
    expect(text).toContain('only available in the mobile app');
    const subscribe = buttons().filter((b) => b.textContent?.includes('Subscribe'));
    expect(subscribe).toHaveLength(2);
    expect(subscribe[0].textContent).toContain('€2.99');
    expect(subscribe[1].textContent).toContain('€19.99');
    expect(track).toHaveBeenCalledWith('billing', 'paywall_open', expect.objectContaining({ source: 'test', offering_id: 'default' }));
  });

  it('asks anonymous visitors to sign in before buying and resumes the purchase afterwards', async () => {
    await render();
    const subscribe = buttons().find((b) => b.textContent?.includes('Subscribe'))!;
    await act(async () => {
      subscribe.click();
    });
    expect(rc.purchaseWebPackage).not.toHaveBeenCalled();
    const dialog = useSignInDialogStore.getState();
    expect(dialog.open).toBe(true);
    expect(dialog.reason).toBe('purchase');

    useAuthStore.setState({ token: 'tok', user });
    await act(async () => {
      dialog.onSuccess?.();
    });
    for (let i = 0; i < 4; i++) await flush();
    expect(rc.purchaseWebPackage).toHaveBeenCalledTimes(1);
  });

  it('purchases for a signed-in user, unlocks premium optimistically and reports success', async () => {
    useAuthStore.setState({ token: 'tok', user });
    const m = await render();
    const subscribe = buttons().find((b) => b.textContent?.includes('€2.99'))!;
    await act(async () => {
      subscribe.click();
    });
    for (let i = 0; i < 4; i++) await flush();
    expect(rc.purchaseWebPackage.mock.calls[0][0]).toMatchObject({ identifier: '$rc_monthly' });
    expect(rc.purchaseWebPackage.mock.calls[0][1]).toBe('a@b.c');
    expect(m.container.querySelector('[data-testid="is-premium"]')!.textContent).toBe('true');
    expect(track).toHaveBeenCalledWith('billing', 'purchase_success', expect.objectContaining({ package_id: '$rc_monthly' }));
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
    expect(buttons().some((b) => b.textContent?.includes('Subscribe'))).toBe(false);
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
    expect(buttons().some((b) => b.textContent?.includes('Subscribe'))).toBe(false);
  });
});

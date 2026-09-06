// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchEntitlement } = vi.hoisted(() => ({ fetchEntitlement: vi.fn() }));
vi.mock('@/lib/api', () => ({ fetchEntitlement }));

import { useAuthStore } from '@/features/account/auth-store';
import { useEntitlementStore } from '@/features/premium/entitlement-store';
import { useEntitlementSync } from '@/features/premium/hooks/useEntitlementSync';
import { setPremiumForTests, useCanShowAds, usePremium } from '@/features/premium/usePremium';
import type { Entitlement } from '@/lib/types';
import { flush, mount, type Mounted } from '../../helpers/react';

const user = { id: 7, email: 'a@b.c', displayName: 'A', dateJoined: '2026-01-01' };
const premium: Entitlement = {
  tier: 'premium',
  source: 'revenuecat',
  status: 'active',
  currentPeriodEnd: null,
  features: ['ad_removal'],
  manageVia: 'web',
};
const free: Entitlement = {
  tier: 'free',
  source: null,
  status: null,
  currentPeriodEnd: null,
  features: [],
  manageVia: 'none',
};

function Readout() {
  const canShowAds = useCanShowAds();
  const isPremium = usePremium();
  return <div>{`ads=${canShowAds} premium=${isPremium}`}</div>;
}

function Probe() {
  useEntitlementSync();
  return <Readout />;
}

let mounted: Mounted | null = null;

async function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mounted = await mount(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  return mounted;
}

async function settle() {
  for (let i = 0; i < 4; i++) {
    await flush();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
}

beforeEach(() => {
  localStorage.clear();
  fetchEntitlement.mockReset();
  useAuthStore.setState({ token: null, user: null, hydrated: true });
  useEntitlementStore.getState().clearEntitlement();
  setPremiumForTests(null);
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
  vi.useRealTimers();
});

describe('useCanShowAds', () => {
  it('shows ads immediately while signed out and never calls the API', async () => {
    const m = await render();
    expect(m.container.textContent).toBe('ads=true premium=false');
    await settle();
    expect(fetchEntitlement).not.toHaveBeenCalled();
  });

  it('withholds ads while a signed-in user has no cached entitlement yet, then honours the answer', async () => {
    useAuthStore.setState({ token: 'tok', user });
    let resolve: (value: Entitlement) => void = () => {};
    fetchEntitlement.mockReturnValue(new Promise<Entitlement>((r) => (resolve = r)));
    const m = await render();
    expect(m.container.textContent).toBe('ads=false premium=false');

    await act(async () => {
      resolve(premium);
    });
    await settle();
    expect(m.container.textContent).toBe('ads=false premium=true');
  });

  it('shows ads once a signed-in user is confirmed free', async () => {
    useAuthStore.setState({ token: 'tok', user });
    fetchEntitlement.mockResolvedValue(free);
    const m = await render();
    await settle();
    expect(m.container.textContent).toBe('ads=true premium=false');
  });

  it('never flashes ads for a returning premium user with a cached entitlement', async () => {
    useAuthStore.setState({ token: 'tok', user });
    useEntitlementStore.getState().reconcileFromBackend(premium);
    fetchEntitlement.mockReturnValue(new Promise(() => {}));
    const m = await render();
    expect(m.container.textContent).toBe('ads=false premium=true');
  });

  it('gives up withholding after the settle timeout when the API never answers', async () => {
    vi.useFakeTimers();
    useAuthStore.setState({ token: 'tok', user });
    fetchEntitlement.mockReturnValue(new Promise(() => {}));
    const m = await render();
    expect(m.container.textContent).toBe('ads=false premium=false');
    await act(async () => {
      vi.advanceTimersByTime(5_100);
    });
    expect(m.container.textContent).toBe('ads=true premium=false');
  });

  it('setPremiumForTests forces the state for suites that do not mount the sync hook', async () => {
    setPremiumForTests(premium);
    mounted = await mount(<Readout />);
    expect(mounted.container.textContent).toBe('ads=false premium=true');
  });
});

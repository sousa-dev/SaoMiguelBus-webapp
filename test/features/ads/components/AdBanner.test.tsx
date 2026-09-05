// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ track }));
vi.mock('@/lib/api', () => ({
  fetchAd: vi.fn(async () => null),
  recordAdClick: vi.fn(async () => undefined),
  fetchBootstrap: vi.fn(async () => ({ island: { enabledModules: ['weather', 'news'] } })),
  verifySubscriptionEmail: vi.fn(async () => ({ hasActiveSubscription: false })),
  postConsent: vi.fn(async () => undefined),
}));

import { AdBanner } from '@/features/ads/components/AdBanner';
import { resetBlockedProvidersForTests } from '@/features/ads/providers/blocked';
import { readWebAdConfig, setWebAdConfigForTests } from '@/features/ads/providers/config';
import { usePremiumStore } from '@/features/premium/usePremium';
import { defaultPurposes, useConsentStore } from '@/lib/consent-store';
import { flush, mount, type Mounted } from '../../../helpers/react';

await import('@/lib/i18n');

const allPurposes = { strictly_necessary: true, analytics: true, ads: true, personalization: true };

let mounted: Mounted | null = null;

function render(node: React.ReactNode, path = '/transit') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return mount(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

async function settle() {
  for (let i = 0; i < 5; i++) {
    await flush();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
}

function events(): string[] {
  return track.mock.calls.map((call) => call[1]);
}

beforeEach(() => {
  track.mockClear();
  resetBlockedProvidersForTests();
  setWebAdConfigForTests(readWebAdConfig({ VITE_WEB_AD_PROVIDERS: 'mock' }));
  usePremiumStore.setState({ isPremium: false, isLoading: false, userEmail: null });
  useConsentStore.setState({ decided: true, purposes: allPurposes });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 684 });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
  setWebAdConfigForTests(null);
});

describe('AdBanner waterfall', () => {
  it('renders nothing at all for premium users', async () => {
    usePremiumStore.setState({ isPremium: true, isLoading: false });
    mounted = await render(<AdBanner on="home" slot="top" />);
    await settle();
    expect(mounted.container.innerHTML).toBe('');
    expect(events()).toEqual([]);
  });

  it('renders the network tier inside the frame when consent allows ads', async () => {
    mounted = await render(<AdBanner on="home" slot="top" />);
    await settle();
    expect(mounted.container.querySelector('.ad-frame')).not.toBeNull();
    expect(mounted.container.textContent).toContain('Mock ad · top');
    expect(events()).toEqual(['ad_network_request', 'ad_network_filled']);
  });

  it('shows the house creative and no network request while consent is undecided', async () => {
    useConsentStore.setState({ decided: false, purposes: defaultPurposes });
    mounted = await render(<AdBanner on="home" slot="top" />);
    await settle();
    expect(mounted.container.querySelector('button')).not.toBeNull(); // InternalAdBanner
    expect(mounted.container.textContent).not.toContain('Mock ad');
    expect(events().filter((e) => e.startsWith('ad_network'))).toEqual([]);
  });

  it('shows the house creative when the ads purpose is rejected', async () => {
    useConsentStore.setState({ decided: true, purposes: { ...allPurposes, ads: false } });
    mounted = await render(<AdBanner on="home" slot="top" />);
    await settle();
    expect(mounted.container.textContent).not.toContain('Mock ad');
    expect(events().filter((e) => e.startsWith('ad_network'))).toEqual([]);
  });

  it('skips the network tier when the page has no publisher content yet', async () => {
    mounted = await render(<AdBanner on="home" slot="top" content={false} />);
    await settle();
    expect(mounted.container.textContent).not.toContain('Mock ad');
    expect(events().filter((e) => e.startsWith('ad_network'))).toEqual([]);
  });

  it('skips the network tier on paths outside the module pages', async () => {
    mounted = await render(<AdBanner on="home" slot="top" />, '/privacy.html');
    await settle();
    expect(mounted.container.textContent).not.toContain('Mock ad');
    expect(events().filter((e) => e.startsWith('ad_network'))).toEqual([]);
  });

  it('falls back to the house creative inside the same frame when every network is unfilled', async () => {
    setWebAdConfigForTests(
      readWebAdConfig({ VITE_WEB_AD_PROVIDERS: 'mock', VITE_WEB_AD_MOCK_RESULT: 'unfilled' }),
    );
    mounted = await render(<AdBanner on="home" slot="inline-1" placement="top" />);
    await settle();
    const frame = mounted.container.querySelector('.ad-frame') as HTMLElement;
    expect(frame).not.toBeNull();
    expect(frame.querySelector('button')).not.toBeNull();
    expect(events()).toEqual(['ad_network_request', 'ad_network_unfilled', 'internal_ad_impression']);
  });
});

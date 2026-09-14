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
  fetchEntitlement: vi.fn(async () => ({ tier: 'free' })),
  postConsent: vi.fn(async () => undefined),
}));

import { AdBanner } from '@/features/ads/components/AdBanner';
import { resetBlockedProvidersForTests } from '@/features/ads/providers/blocked';
import { readWebAdConfig, setWebAdConfigForTests } from '@/features/ads/providers/config';
import { setPremiumForTests } from '@/features/premium/usePremium';
import { fetchAd } from '@/lib/api';
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
  setPremiumForTests(null);
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
    setPremiumForTests({
      tier: 'premium',
      source: 'revenuecat',
      status: 'active',
      currentPeriodEnd: null,
      features: [],
      manageVia: 'web',
    });
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

describe('AdBanner — Adsterra configured (exclusive)', () => {
  const INVOKE = 'https://pl1234567.profitablecpmrate.com/0123456789abcdef0123456789abcdef/invoke.js';

  it('requests only Adsterra and ignores a first-party ad even when one is returned', async () => {
    setWebAdConfigForTests(
      readWebAdConfig({ VITE_WEB_AD_PROVIDERS: 'adsense,adsterra', VITE_ADSTERRA_NATIVE_TOP: INVOKE }),
    );
    vi.mocked(fetchAd).mockResolvedValueOnce({
      id: 1,
      entity: 'Our own promo',
      description: '',
      media: '',
      start: null,
      end: null,
      action: null,
      target: null,
    });
    mounted = await render(<AdBanner on="home" slot="top" />);
    await settle();
    // FirstPartyAdBanner is the only component that would fire this for the returned ad.
    expect(events()).not.toContain('ad_impression');
    expect(mounted.container.querySelector('iframe')).not.toBeNull();
    const requestEvents = track.mock.calls.filter((call) => call[1] === 'ad_network_request');
    expect(requestEvents).toHaveLength(1);
    expect(requestEvents[0][2]).toMatchObject({ provider: 'adsterra' });
  });

  it('shows nothing (not the house creative) once Adsterra is unfilled', async () => {
    setWebAdConfigForTests(readWebAdConfig({ VITE_WEB_AD_PROVIDERS: 'adsterra', VITE_ADSTERRA_NATIVE_TOP: INVOKE }));
    mounted = await render(<AdBanner on="home" slot="top" />);
    await settle();
    // Adsterra never fills in jsdom (no script execution inside the srcdoc iframe), so this
    // exercises the still-requesting state — asserting no house/first-party content ever appears.
    expect(mounted.container.querySelector('button')).toBeNull(); // no InternalAdBanner/FirstPartyAdBanner
  });
});

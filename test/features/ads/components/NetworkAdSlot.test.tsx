// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ track }));

import { NetworkAdSlot } from '@/features/ads/components/NetworkAdSlot';
import { resetBlockedProvidersForTests, isProviderBlocked } from '@/features/ads/providers/blocked';
import { readWebAdConfig } from '@/features/ads/providers/config';
import { getNetworkProviders } from '@/features/ads/providers/registry';
import type { NetworkSlotProps, WebAdProvider } from '@/features/ads/providers/types';
import { flush, mount, type Mounted } from '../../../helpers/react';

// Top-level so the first render already has the "Ad" label translated.
await import('@/lib/i18n');

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;
const observers: Array<{ callback: Callback }> = [];
class FakeIntersectionObserver {
  constructor(public callback: Callback) {
    observers.push({ callback });
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const originalIO = globalThis.IntersectionObserver;
let mounted: Mounted | null = null;

beforeEach(() => {
  track.mockClear();
  observers.length = 0;
  resetBlockedProvidersForTests();
  globalThis.IntersectionObserver = FakeIntersectionObserver as unknown as typeof IntersectionObserver;
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 684,
  });
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
  globalThis.IntersectionObserver = originalIO;
});

function events(): string[] {
  return track.mock.calls.map((call) => `${call[1]}:${call[2].provider}`);
}

function providersFor(list: string, extra: Record<string, string> = {}): WebAdProvider[] {
  return getNetworkProviders(readWebAdConfig({ VITE_WEB_AD_PROVIDERS: list, ...extra }));
}

/** A provider whose script fails, to check the blocked registry. */
function failingProvider(): WebAdProvider {
  function Slot({ onUnfilled }: NetworkSlotProps) {
    onUnfilledRef.current = onUnfilled;
    return <div>failing</div>;
  }
  return {
    id: 'adsense',
    supportsNonPersonalized: true,
    isConfigured: () => true,
    frameHeight: (size) => size.height,
    load: () => Promise.resolve('blocked'),
    Slot,
    teardown: () => {},
  };
}
const onUnfilledRef: { current: NetworkSlotProps['onUnfilled'] | null } = { current: null };

describe('NetworkAdSlot', () => {
  it('reserves a frame sized to the container and labels it as an ad', async () => {
    const onExhausted = vi.fn();
    mounted = await mount(
      <NetworkAdSlot
        on="home"
        slot="top"
        placement="top"
        consentMode="personalized"
        providers={providersFor('mock')}
        onExhausted={onExhausted}
      />,
    );
    const frame = mounted.container.querySelector('.ad-frame') as HTMLElement;
    expect(frame.style.height).toBe('60px'); // 468×60 fits a 684px column
    expect(frame.textContent).toContain('Mock ad · top · 468×60');
    expect(events()).toEqual(['ad_network_request:mock', 'ad_network_filled:mock']);
    expect(onExhausted).not.toHaveBeenCalled();
  });

  it('advances past an unfilled provider and reports exhaustion when none fills', async () => {
    const onExhausted = vi.fn();
    mounted = await mount(
      <NetworkAdSlot
        on="home"
        slot="top"
        placement="top"
        consentMode="personalized"
        providers={providersFor('none')}
        onExhausted={onExhausted}
      />,
    );
    await flush();
    expect(events()).toEqual(['ad_network_request:none', 'ad_network_unfilled:none']);
    expect(track.mock.calls[1][2].reason).toBe('not-configured');
    expect(onExhausted).toHaveBeenCalledTimes(1);
  });

  it('falls through none to mock', async () => {
    const onExhausted = vi.fn();
    mounted = await mount(
      <NetworkAdSlot
        on="home"
        slot="inline-1"
        placement="top"
        consentMode="personalized"
        providers={providersFor('none,mock')}
        onExhausted={onExhausted}
      />,
    );
    await flush();
    expect(events()).toEqual([
      'ad_network_request:none',
      'ad_network_unfilled:none',
      'ad_network_request:mock',
      'ad_network_filled:mock',
    ]);
    expect(onExhausted).not.toHaveBeenCalled();
  });

  it('skips providers that cannot run non-personalized and those not configured for the placement', async () => {
    const onExhausted = vi.fn();
    const providers = providersFor('adsterra,mock', {
      VITE_ADSTERRA_NATIVE_TOP: 'https://pl1.profitablecpmrate.com/0123456789abcdef0123456789abcdef/invoke.js',
    });
    mounted = await mount(
      <NetworkAdSlot
        on="home"
        slot="top"
        placement="top"
        consentMode="non-personalized"
        providers={providers}
        onExhausted={onExhausted}
      />,
    );
    await flush();
    expect(events()).toEqual(['ad_network_request:mock', 'ad_network_filled:mock']);
  });

  it('marks a provider blocked for the session when its script fails', async () => {
    const onExhausted = vi.fn();
    mounted = await mount(
      <NetworkAdSlot
        on="home"
        slot="top"
        placement="top"
        consentMode="personalized"
        providers={[failingProvider()]}
        onExhausted={onExhausted}
      />,
    );
    await act(async () => {
      onUnfilledRef.current?.('script-failed');
    });
    expect(isProviderBlocked('adsense')).toBe(true);
    expect(onExhausted).toHaveBeenCalledTimes(1);
  });

  it('does not request an inline unit until it is near the viewport', async () => {
    mounted = await mount(
      <NetworkAdSlot
        on="home"
        slot="inline-11"
        placement="inline"
        consentMode="personalized"
        providers={providersFor('mock')}
        onExhausted={vi.fn()}
      />,
    );
    expect(events()).toEqual([]);
    expect(mounted.container.querySelector('.ad-frame')).not.toBeNull();

    await act(async () => {
      observers[0].callback([{ isIntersecting: true }]);
    });
    await flush();
    expect(events()).toEqual(['ad_network_request:mock', 'ad_network_filled:mock']);
  });

  it('reports exhaustion at once when no provider is eligible', async () => {
    const onExhausted = vi.fn();
    mounted = await mount(
      <NetworkAdSlot
        on="home"
        slot="top"
        placement="top"
        consentMode="personalized"
        providers={[]}
        onExhausted={onExhausted}
      />,
    );
    await flush();
    expect(onExhausted).toHaveBeenCalledTimes(1);
    expect(events()).toEqual([]);
  });
});

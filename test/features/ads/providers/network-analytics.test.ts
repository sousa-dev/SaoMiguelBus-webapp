import { beforeEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ track }));

import { trackNetworkAd } from '@/features/ads/providers/network-analytics';

describe('trackNetworkAd', () => {
  beforeEach(() => {
    track.mockClear();
  });

  it('sends every network event on the transit module with provider, on, slot and placement', () => {
    const props = { provider: 'adsterra', on: 'home', slot: 'inline-3', placement: 'inline' } as const;
    trackNetworkAd('ad_network_request', props);
    trackNetworkAd('ad_network_filled', props);
    trackNetworkAd('ad_network_unfilled', { ...props, reason: 'timeout' });
    trackNetworkAd('ad_network_click', props);

    expect(track.mock.calls.map((call) => call.slice(0, 2))).toEqual([
      ['transit', 'ad_network_request'],
      ['transit', 'ad_network_filled'],
      ['transit', 'ad_network_unfilled'],
      ['transit', 'ad_network_click'],
    ]);
    expect(track.mock.calls[2][2]).toEqual({ ...props, reason: 'timeout' });
  });
});

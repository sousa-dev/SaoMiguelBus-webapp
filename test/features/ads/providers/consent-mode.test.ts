import { describe, expect, it } from 'vitest';

import { resolveNetworkConsentMode } from '@/features/ads/providers/consent-mode';

const all = { strictly_necessary: true, analytics: true, ads: true, personalization: true };

describe('resolveNetworkConsentMode', () => {
  it('blocks every network while the user has not decided', () => {
    expect(resolveNetworkConsentMode({ decided: false, purposes: all })).toBe('blocked');
  });

  it('blocks every network when the ads purpose is rejected', () => {
    expect(
      resolveNetworkConsentMode({ decided: true, purposes: { ...all, ads: false } }),
    ).toBe('blocked');
  });

  it('runs non-personalized when ads is on but personalization is off', () => {
    expect(
      resolveNetworkConsentMode({ decided: true, purposes: { ...all, personalization: false } }),
    ).toBe('non-personalized');
  });

  it('runs personalized when both ads and personalization are on', () => {
    expect(resolveNetworkConsentMode({ decided: true, purposes: all })).toBe('personalized');
  });
});

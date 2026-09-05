import { describe, expect, it } from 'vitest';

import { resolveAdSlotKind } from '@/features/ads/lib/ad-slot';
import type { AdPayload } from '@/lib/types';

const sampleAd: AdPayload = {
  id: 1,
  entity: 'Test',
  description: '',
  media: 'https://example.com/ad.png',
  start: null,
  end: null,
  action: null,
  target: null,
};

describe('resolveAdSlotKind (web)', () => {
  it('returns null when slot is disabled', () => {
    expect(
      resolveAdSlotKind({
        enabled: false,
        firstParty: sampleAd,
        fetched: true,
      }),
    ).toBeNull();
  });

  it('prefers first-party when inventory exists', () => {
    expect(
      resolveAdSlotKind({
        enabled: true,
        firstParty: sampleAd,
        fetched: true,
      }),
    ).toBe('first-party');
  });

  it('falls back to internal when fetch is empty', () => {
    expect(
      resolveAdSlotKind({
        enabled: true,
        firstParty: null,
        fetched: true,
      }),
    ).toBe('internal');
  });

  it('waits for fetch before internal fallback', () => {
    expect(
      resolveAdSlotKind({
        enabled: true,
        firstParty: null,
        fetched: false,
      }),
    ).toBeNull();
  });
});

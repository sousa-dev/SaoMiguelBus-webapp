import { beforeEach, describe, expect, it } from 'vitest';

import {
  isProviderBlocked,
  markProviderBlocked,
  resetBlockedProvidersForTests,
} from '@/features/ads/providers/blocked';

describe('blocked provider registry', () => {
  beforeEach(() => {
    resetBlockedProvidersForTests();
  });

  it('starts with nothing blocked', () => {
    expect(isProviderBlocked('adsense')).toBe(false);
  });

  it('remembers a provider whose script failed for the rest of the session', () => {
    markProviderBlocked('adsense');
    expect(isProviderBlocked('adsense')).toBe(true);
    expect(isProviderBlocked('adsterra')).toBe(false);
  });
});

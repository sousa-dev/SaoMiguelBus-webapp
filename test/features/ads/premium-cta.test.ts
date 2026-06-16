import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openPremiumStore } from '@/features/ads/lib/premium-cta';
import { useStoreChooserStore } from '@/features/ads/lib/store-chooser-store';

vi.mock('@/lib/platform', () => ({
  detectPlatform: vi.fn(),
}));

vi.mock('@/lib/app-links', () => ({
  openPremiumStore: vi.fn((chooser: () => void) => {
    chooser();
  }),
}));

import { detectPlatform } from '@/lib/platform';
import { openPremiumStore as openStoreLink } from '@/lib/app-links';

describe('openPremiumStore (wrapper)', () => {
  beforeEach(() => {
    useStoreChooserStore.setState({ open: false });
    vi.mocked(openStoreLink).mockImplementation((chooser) => {
      chooser();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to app-links openPremiumStore with chooser callback', () => {
    openPremiumStore();
    expect(openStoreLink).toHaveBeenCalledTimes(1);
    expect(useStoreChooserStore.getState().open).toBe(true);
  });

  it('exposes detectPlatform via getPremiumStorePlatform', async () => {
    vi.mocked(detectPlatform).mockReturnValue('ios');
    const { getPremiumStorePlatform } = await import('@/features/ads/lib/premium-cta');
    expect(getPremiumStorePlatform()).toBe('ios');
  });
});

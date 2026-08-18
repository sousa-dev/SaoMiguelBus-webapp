import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStoreChooserStore } from '@/features/ads/lib/store-chooser-store';

vi.mock('@/lib/app-links', () => ({
  openPremiumStore: vi.fn((chooser: () => void) => {
    chooser();
  }),
}));

import { openPremiumStore as openStoreLink } from '@/lib/app-links';
import { openMinibusLiveInstallPrompt } from '@/features/minibus/lib/live-install';

describe('openMinibusLiveInstallPrompt', () => {
  beforeEach(() => {
    useStoreChooserStore.setState({ open: false, content: null });
    vi.mocked(openStoreLink).mockImplementation((chooser) => {
      chooser();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens the store chooser with Mini Bus live copy, not the premium default', () => {
    openMinibusLiveInstallPrompt(
      'See buses in real time',
      'Download the São Miguel Bus app, free, to see Mini Bus locations in real time.',
    );

    expect(openStoreLink).toHaveBeenCalledTimes(1);
    expect(useStoreChooserStore.getState().open).toBe(true);
    expect(useStoreChooserStore.getState().content).toEqual({
      title: 'See buses in real time',
      body: 'Download the São Miguel Bus app, free, to see Mini Bus locations in real time.',
    });
  });
});

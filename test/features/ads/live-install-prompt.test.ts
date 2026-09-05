import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStoreChooserStore } from '@/features/ads/lib/store-chooser-store';

vi.mock('@/lib/app-links', () => ({
  openPremiumStore: vi.fn((chooser: () => void) => {
    chooser();
  }),
}));

import { openPremiumStore as openStoreLink } from '@/lib/app-links';
import { openLiveInstallPrompt } from '@/features/ads/lib/live-install-prompt';

describe('openLiveInstallPrompt', () => {
  beforeEach(() => {
    useStoreChooserStore.setState({ open: false, content: null });
    vi.mocked(openStoreLink).mockImplementation((chooser) => {
      chooser();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('opens the store chooser with the caller-supplied live-tracking copy, not the premium default', () => {
    openLiveInstallPrompt(
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

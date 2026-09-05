import { beforeEach, describe, expect, it } from 'vitest';

import { useStoreChooserStore } from '@/features/ads/lib/store-chooser-store';

describe('useStoreChooserStore', () => {
  beforeEach(() => {
    useStoreChooserStore.setState({ open: false, content: null });
  });

  it('opens with no copy override when show() is called without args', () => {
    useStoreChooserStore.getState().show();

    expect(useStoreChooserStore.getState().open).toBe(true);
    expect(useStoreChooserStore.getState().content).toBeNull();
  });

  it('stores optional title and body for a non-premium handoff', () => {
    useStoreChooserStore.getState().show({
      title: 'See buses in real time',
      body: 'Download the São Miguel Bus app, free.',
    });

    expect(useStoreChooserStore.getState().open).toBe(true);
    expect(useStoreChooserStore.getState().content).toEqual({
      title: 'See buses in real time',
      body: 'Download the São Miguel Bus app, free.',
    });
  });

  it('clears copy when hide() runs so the next open is not stale', () => {
    useStoreChooserStore.getState().show({ title: 't', body: 'b' });
    useStoreChooserStore.getState().hide();

    expect(useStoreChooserStore.getState().open).toBe(false);
    expect(useStoreChooserStore.getState().content).toBeNull();
  });
});

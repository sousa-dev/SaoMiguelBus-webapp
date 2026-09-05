import { useEffect } from 'react';

import type { NetworkSlotProps, WebAdProvider } from '@/features/ads/providers/types';

function NoneSlot({ onUnfilled }: NetworkSlotProps) {
  useEffect(() => {
    onUnfilled('not-configured');
    // Deliberately once per mount: the parent advances the waterfall on this call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Loads nothing and yields immediately. For tests and for local dev without any network. */
export function createNoneProvider(): WebAdProvider {
  return {
    id: 'none',
    supportsNonPersonalized: true,
    isConfigured: () => true,
    frameHeight: (size) => size.height,
    load: () => Promise.resolve('ready'),
    Slot: NoneSlot,
    teardown: () => {},
  };
}

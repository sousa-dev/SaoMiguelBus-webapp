import { useEffect } from 'react';

import type { NetworkSlotProps, WebAdConfig, WebAdProvider } from '@/features/ads/providers/types';

/**
 * Placeholder creative for local development: shows the reserved frame and exercises the fill /
 * unfilled paths of the waterfall without contacting a network. `VITE_WEB_AD_MOCK_RESULT=unfilled`
 * forces the house fallback so the swap can be checked for layout shift.
 */
export function createMockProvider(config: WebAdConfig): WebAdProvider {
  function MockSlot({ placement, size, onFilled, onUnfilled }: NetworkSlotProps) {
    useEffect(() => {
      if (config.mock.result === 'filled') {
        onFilled();
      } else {
        onUnfilled('unfilled');
      }
      // Once per mount, like a real network response.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (config.mock.result !== 'filled') return null;

    return (
      <div
        className="flex h-full w-full items-center justify-center border-2 border-dashed border-outline bg-surface-variant text-xs font-semibold text-muted"
        style={{ height: size.height }}
      >
        Mock ad · {placement} · {size.width}×{size.height}
      </div>
    );
  }

  return {
    id: 'mock',
    supportsNonPersonalized: true,
    isConfigured: () => true,
    frameHeight: (size) => size.height,
    load: () => Promise.resolve('ready'),
    Slot: MockSlot,
    teardown: () => {},
  };
}

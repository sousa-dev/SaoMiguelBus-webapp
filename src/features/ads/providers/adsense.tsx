import { useEffect, useRef } from 'react';

import { loadScriptOnce } from '@/features/ads/providers/script-loader';
import type {
  ActiveConsentMode,
  NetworkSlotProps,
  WebAdConfig,
  WebAdProvider,
} from '@/features/ads/providers/types';

const SCRIPT_BASE = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
const DEFAULT_TIMEOUT_MS = 10_000;

type AdsbygoogleQueue = Array<Record<string, unknown>> & {
  requestNonPersonalizedAds?: number;
  pauseAdRequests?: number;
};

declare global {
  interface Window {
    adsbygoogle?: AdsbygoogleQueue;
  }
}

function queue(): AdsbygoogleQueue {
  window.adsbygoogle = window.adsbygoogle || [];
  return window.adsbygoogle;
}

/**
 * Google AdSense, manual display units. The script is injected once, only from a slot (so only
 * after consent), with `requestNonPersonalizedAds` set from the consent mode before any request.
 * Fill/unfilled comes from the `data-ad-status` attribute Google writes on the `<ins>`.
 */
export function createAdsenseProvider(
  config: WebAdConfig,
  options: { timeoutMs?: number } = {},
): WebAdProvider {
  const { client, slots, test } = config.adsense;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  function load(mode: ActiveConsentMode): Promise<'ready' | 'blocked'> {
    if (typeof window === 'undefined' || !client) return Promise.resolve('blocked');
    queue().requestNonPersonalizedAds = mode === 'non-personalized' ? 1 : 0;
    return loadScriptOnce(`${SCRIPT_BASE}?client=${encodeURIComponent(client)}`, {
      attrs: { crossorigin: 'anonymous' },
    });
  }

  function AdsenseSlot({ placement, consentMode, size, onFilled, onUnfilled }: NetworkSlotProps) {
    const insRef = useRef<HTMLModElement>(null);
    const callbacks = useRef({ onFilled, onUnfilled });
    callbacks.current = { onFilled, onUnfilled };
    const slotId = slots[placement];

    useEffect(() => {
      const ins = insRef.current;
      if (!ins || !slotId || !client) {
        callbacks.current.onUnfilled('not-configured');
        return;
      }

      let settled = false;
      let observer: MutationObserver | null = null;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        observer?.disconnect();
        observer = null;
        if (timer) clearTimeout(timer);
        timer = null;
      };
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        fn();
      };
      const check = () => {
        const status = ins.getAttribute('data-ad-status');
        if (status === 'filled') settle(() => callbacks.current.onFilled());
        else if (status === 'unfilled' || status === 'unfill-optimized') {
          settle(() => callbacks.current.onUnfilled('unfilled'));
        }
      };

      void load(consentMode).then((result) => {
        if (settled) return;
        if (result === 'blocked') {
          settle(() => callbacks.current.onUnfilled('script-failed'));
          return;
        }
        observer = new MutationObserver(check);
        observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
        timer = setTimeout(() => settle(() => callbacks.current.onUnfilled('timeout')), timeoutMs);
        queue().push({});
        check();
      });

      return () => {
        settled = true;
        cleanup();
      };
    }, [consentMode, slotId]);

    return (
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'inline-block', width: size.width, height: size.height }}
        data-ad-client={client ?? undefined}
        data-ad-slot={slotId ?? undefined}
        data-adtest={test ? 'on' : undefined}
      />
    );
  }

  return {
    id: 'adsense',
    supportsNonPersonalized: true,
    isConfigured: (placement) => Boolean(client && slots[placement]),
    frameHeight: (size) => size.height,
    load,
    Slot: AdsenseSlot,
    teardown: () => {},
  };
}

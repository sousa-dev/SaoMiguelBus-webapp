// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createAdsenseProvider } from '@/features/ads/providers/adsense';
import { readWebAdConfig } from '@/features/ads/providers/config';
import { resetScriptLoaderForTests } from '@/features/ads/providers/script-loader';
import type { NetworkSlotProps } from '@/features/ads/providers/types';
import { flush, mount, type Mounted } from '../../../helpers/react';

type AdsbygoogleQueue = unknown[] & { requestNonPersonalizedAds?: number };

const baseEnv = {
  VITE_WEB_AD_PROVIDERS: 'adsense',
  VITE_ADSENSE_CLIENT: 'ca-pub-1',
  VITE_ADSENSE_SLOT_TOP: '111',
  VITE_ADSENSE_SLOT_INLINE: '222',
};

function props(overrides: Partial<NetworkSlotProps> = {}): NetworkSlotProps {
  return {
    on: 'home',
    slot: 'top',
    placement: 'top',
    consentMode: 'personalized',
    size: { width: 468, height: 60 },
    onFilled: vi.fn(),
    onUnfilled: vi.fn(),
    ...overrides,
  };
}

function adsScript(): HTMLScriptElement | undefined {
  return Array.from(document.querySelectorAll('script')).find((s) =>
    s.src.includes('adsbygoogle.js'),
  );
}

let mounted: Mounted | null = null;

beforeEach(() => {
  resetScriptLoaderForTests();
  document.head.innerHTML = '';
  delete (window as unknown as { adsbygoogle?: unknown }).adsbygoogle;
});

afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('AdSense provider', () => {
  it('is configured only when a client and a slot id for the placement exist', () => {
    const provider = createAdsenseProvider(readWebAdConfig(baseEnv));
    expect(provider.isConfigured('top')).toBe(true);
    expect(provider.isConfigured('sidebar')).toBe(true); // falls back to inline
    expect(createAdsenseProvider(readWebAdConfig({})).isConfigured('top')).toBe(false);
    expect(provider.supportsNonPersonalized).toBe(true);
  });

  it('renders a fixed-size ins unit with the client, slot and test flag, then loads the script once', async () => {
    const provider = createAdsenseProvider(readWebAdConfig({ ...baseEnv, DEV: true }));
    const p = props();
    mounted = await mount(<provider.Slot {...p} />);

    const ins = mounted.container.querySelector('ins.adsbygoogle') as HTMLElement;
    expect(ins.getAttribute('data-ad-client')).toBe('ca-pub-1');
    expect(ins.getAttribute('data-ad-slot')).toBe('111');
    expect(ins.getAttribute('data-adtest')).toBe('on');
    expect(ins.style.width).toBe('468px');
    expect(ins.style.height).toBe('60px');

    const script = adsScript();
    expect(script?.src).toBe('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1');
    expect(script?.getAttribute('crossorigin')).toBe('anonymous');
  });

  it('omits data-adtest in production builds', async () => {
    const provider = createAdsenseProvider(readWebAdConfig({ ...baseEnv, DEV: false }));
    mounted = await mount(<provider.Slot {...props()} />);
    expect(mounted.container.querySelector('ins')?.hasAttribute('data-adtest')).toBe(false);
  });

  it('sets requestNonPersonalizedAds=1 before requesting when personalization is off', async () => {
    const provider = createAdsenseProvider(readWebAdConfig(baseEnv));
    mounted = await mount(<provider.Slot {...props({ consentMode: 'non-personalized' })} />);
    const queue = (window as unknown as { adsbygoogle: AdsbygoogleQueue }).adsbygoogle;
    expect(queue.requestNonPersonalizedAds).toBe(1);
  });

  it('pushes the request after the script loads and reports filled from data-ad-status', async () => {
    const provider = createAdsenseProvider(readWebAdConfig(baseEnv));
    const p = props();
    mounted = await mount(<provider.Slot {...p} />);
    const queue = (window as unknown as { adsbygoogle: AdsbygoogleQueue }).adsbygoogle;
    expect(queue.requestNonPersonalizedAds).toBe(0);
    expect(queue.length).toBe(0);

    await act(async () => {
      adsScript()!.dispatchEvent(new Event('load'));
    });
    await flush();
    expect(queue.length).toBe(1);

    const ins = mounted.container.querySelector('ins')!;
    await act(async () => {
      ins.setAttribute('data-ad-status', 'filled');
      await Promise.resolve();
    });
    expect(p.onFilled).toHaveBeenCalledTimes(1);
    expect(p.onUnfilled).not.toHaveBeenCalled();
  });

  it('reports unfilled when AdSense marks the unit unfilled', async () => {
    const provider = createAdsenseProvider(readWebAdConfig(baseEnv));
    const p = props();
    mounted = await mount(<provider.Slot {...p} />);
    await act(async () => {
      adsScript()!.dispatchEvent(new Event('load'));
    });
    await flush();
    const ins = mounted.container.querySelector('ins')!;
    await act(async () => {
      ins.setAttribute('data-ad-status', 'unfilled');
      await Promise.resolve();
    });
    expect(p.onUnfilled).toHaveBeenCalledWith('unfilled');
  });

  it('reports script-failed when the script is blocked', async () => {
    const provider = createAdsenseProvider(readWebAdConfig(baseEnv));
    const p = props();
    mounted = await mount(<provider.Slot {...p} />);
    await act(async () => {
      adsScript()!.dispatchEvent(new Event('error'));
    });
    await flush();
    expect(p.onUnfilled).toHaveBeenCalledWith('script-failed');
  });

  it('reports timeout when no status arrives in time', async () => {
    const provider = createAdsenseProvider(readWebAdConfig(baseEnv), { timeoutMs: 10 });
    const p = props();
    mounted = await mount(<provider.Slot {...p} />);
    await act(async () => {
      adsScript()!.dispatchEvent(new Event('load'));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(p.onUnfilled).toHaveBeenCalledWith('timeout');
  });
});

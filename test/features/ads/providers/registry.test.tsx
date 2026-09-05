// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { readWebAdConfig } from '@/features/ads/providers/config';
import { getNetworkProviders } from '@/features/ads/providers/registry';
import type { NetworkSlotProps } from '@/features/ads/providers/types';
import { mount, type Mounted } from '../../../helpers/react';

const size = { width: 468, height: 60 };

function slotProps(overrides: Partial<NetworkSlotProps> = {}): NetworkSlotProps {
  return {
    on: 'home',
    slot: 'top',
    placement: 'top',
    consentMode: 'personalized',
    size,
    onFilled: vi.fn(),
    onUnfilled: vi.fn(),
    ...overrides,
  };
}

let mounted: Mounted | null = null;
afterEach(async () => {
  await mounted?.unmount();
  mounted = null;
});

describe('getNetworkProviders', () => {
  it('returns provider instances in the configured order', () => {
    const config = readWebAdConfig({ VITE_WEB_AD_PROVIDERS: 'mock,none,adsterra,adsense' });
    expect(getNetworkProviders(config).map((p) => p.id)).toEqual([
      'mock',
      'none',
      'adsterra',
      'adsense',
    ]);
  });

  it('returns the same instances for the same config object', () => {
    const config = readWebAdConfig({ VITE_WEB_AD_PROVIDERS: 'mock' });
    expect(getNetworkProviders(config)[0]).toBe(getNetworkProviders(config)[0]);
  });
});

describe('none provider', () => {
  it('never loads anything and reports not-configured immediately', async () => {
    const [none] = getNetworkProviders(readWebAdConfig({ VITE_WEB_AD_PROVIDERS: 'none' }));
    await expect(none.load('personalized')).resolves.toBe('ready');
    expect(none.isConfigured('top')).toBe(true);

    const props = slotProps();
    mounted = await mount(<none.Slot {...props} />);
    expect(mounted.container.innerHTML).toBe('');
    expect(props.onUnfilled).toHaveBeenCalledWith('not-configured');
    expect(props.onFilled).not.toHaveBeenCalled();
    expect(document.querySelectorAll('script')).toHaveLength(0);
  });
});

describe('mock provider', () => {
  it('renders a placeholder with the placement and size and reports filled', async () => {
    const [mock] = getNetworkProviders(readWebAdConfig({ VITE_WEB_AD_PROVIDERS: 'mock' }));
    const props = slotProps({ placement: 'inline' });
    mounted = await mount(<mock.Slot {...props} />);
    expect(mounted.container.textContent).toContain('inline');
    expect(mounted.container.textContent).toContain('468×60');
    expect(props.onFilled).toHaveBeenCalledTimes(1);
    expect(mock.frameHeight(size)).toBe(60);
  });

  it('reports unfilled when VITE_WEB_AD_MOCK_RESULT=unfilled', async () => {
    const [mock] = getNetworkProviders(
      readWebAdConfig({ VITE_WEB_AD_PROVIDERS: 'mock', VITE_WEB_AD_MOCK_RESULT: 'unfilled' }),
    );
    const props = slotProps();
    mounted = await mount(<mock.Slot {...props} />);
    expect(props.onUnfilled).toHaveBeenCalledWith('unfilled');
    expect(props.onFilled).not.toHaveBeenCalled();
  });
});

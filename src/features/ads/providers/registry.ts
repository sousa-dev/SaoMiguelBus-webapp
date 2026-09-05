import { createAdsenseProvider } from '@/features/ads/providers/adsense';
import { createAdsterraProvider } from '@/features/ads/providers/adsterra';
import { getWebAdConfig } from '@/features/ads/providers/config';
import { createMockProvider } from '@/features/ads/providers/mock';
import { createNoneProvider } from '@/features/ads/providers/none';
import type { NetworkProviderId, WebAdConfig, WebAdProvider } from '@/features/ads/providers/types';

const factories: Record<NetworkProviderId, (config: WebAdConfig) => WebAdProvider> = {
  adsense: createAdsenseProvider,
  adsterra: createAdsterraProvider,
  mock: createMockProvider,
  none: createNoneProvider,
};

const instances = new WeakMap<WebAdConfig, WebAdProvider[]>();

/** Ordered network providers for a config. Instances are shared so scripts load once per app. */
export function getNetworkProviders(config: WebAdConfig = getWebAdConfig()): WebAdProvider[] {
  const cached = instances.get(config);
  if (cached) return cached;
  const providers = config.providers.map((id) => factories[id](config));
  instances.set(config, providers);
  return providers;
}

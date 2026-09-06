import {
  Bus,
  BusFront,
  CloudSun,
  Compass,
  Home,
  Mountain,
  Newspaper,
  Store,
  TriangleAlert,
  Waves,
  type LucideIcon,
} from 'lucide-react';

import type { ModuleKey } from '@/config/island';

export interface NavModule {
  key: ModuleKey;
  route: string;
  labelKey: string;
  Icon: LucideIcon;
}

/** Home is always present. */
export const HUB_NAV = {
  route: '/hub',
  labelKey: 'hubTitle',
  Icon: Home,
} as const;

/** Ordered like the mobile hub tab bar. `key` gates visibility via bootstrap.enabledModules. */
export const NAV_MODULES: NavModule[] = [
  { key: 'transit', route: '/transit', labelKey: 'navBarSearchLabel', Icon: Bus },
  { key: 'minibus', route: '/minibus', labelKey: 'navBarMinibusLabel', Icon: BusFront },
  { key: 'news', route: '/news', labelKey: 'navBarNewsLabel', Icon: Newspaper },
  { key: 'weather', route: '/weather', labelKey: 'navBarWeatherLabel', Icon: CloudSun },
  { key: 'seismic', route: '/earthquakes', labelKey: 'navBarEarthquakesLabel', Icon: Waves },
  { key: 'trails', route: '/trails', labelKey: 'navBarTrailsLabel', Icon: Mountain },
  { key: 'events', route: '/tours', labelKey: 'navBarToursLabel', Icon: Compass },
  { key: 'traffic', route: '/traffic', labelKey: 'homeTrafficTitle', Icon: TriangleAlert },
  { key: 'marketplace', route: '/marketplace', labelKey: 'navBarMarketplaceLabel', Icon: Store },
];

export function getModule(key: ModuleKey): NavModule | undefined {
  return NAV_MODULES.find((m) => m.key === key);
}

/** The mobile app's fixed bottom tab bar: Início, then these four (filtered by enabled modules). */
export const FIXED_TAB_MODULE_KEYS: ModuleKey[] = ['transit', 'events', 'minibus', 'weather'];

/** The bottom-tab-bar modules (Início excluded — it's rendered separately, always first). */
export function orderedTabModules(enabledKeys: ModuleKey[]): NavModule[] {
  const enabled = new Set(enabledKeys);
  return FIXED_TAB_MODULE_KEYS.filter((key) => enabled.has(key))
    .map((key) => getModule(key))
    .filter((m): m is NavModule => m != null);
}

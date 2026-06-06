import {
  Bus,
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
  route: '/',
  labelKey: 'hubTitle',
  Icon: Home,
} as const;

/** Ordered like the mobile hub tab bar. `key` gates visibility via bootstrap.enabledModules. */
export const NAV_MODULES: NavModule[] = [
  { key: 'transit', route: '/transit', labelKey: 'navBarSearchLabel', Icon: Bus },
  { key: 'news', route: '/news', labelKey: 'navBarNewsLabel', Icon: Newspaper },
  { key: 'weather', route: '/weather', labelKey: 'navBarWeatherLabel', Icon: CloudSun },
  { key: 'seismic', route: '/earthquakes', labelKey: 'navBarEarthquakesLabel', Icon: Waves },
  { key: 'trails', route: '/trails', labelKey: 'navBarTrailsLabel', Icon: Mountain },
  { key: 'events', route: '/tours', labelKey: 'navBarToursLabel', Icon: Compass },
  { key: 'traffic', route: '/traffic', labelKey: 'homeTrafficTitle', Icon: TriangleAlert },
  { key: 'marketplace', route: '/marketplace', labelKey: 'navBarMarketplaceLabel', Icon: Store },
];

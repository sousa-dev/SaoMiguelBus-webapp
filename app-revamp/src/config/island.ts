/** Build-time island config — merged with /api/v3/bootstrap at runtime. */

export type ModuleKey =
  | 'transit'
  | 'news'
  | 'seismic'
  | 'marketplace'
  | 'trails'
  | 'traffic'
  | 'events'
  | 'weather';

export interface IslandConfig {
  islandKey: string;
  islandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  defaultLocale: string;
  locales: string[];
  enabledModules: ModuleKey[];
  mapCenter: { lat: number; lng: number };
}

const islandKey = import.meta.env.VITE_ISLAND_KEY ?? 'sao-miguel';

export const staticIslandConfig: IslandConfig = {
  islandKey,
  islandName: 'São Miguel',
  primaryColor: '#218732',
  secondaryColor: '#343434',
  accentColor: '#ffc107',
  defaultLocale: 'pt',
  locales: ['pt', 'en', 'de', 'es', 'fr'],
  enabledModules: ['transit', 'events'],
  mapCenter: { lat: 37.7822, lng: -25.4998 },
};

/**
 * Merge bootstrap modules with build-time static modules so client-shipped tabs
 * stay visible when the API flag lags behind the app.
 */
export function resolveEnabledModules(fromBootstrap: string[] | undefined): ModuleKey[] {
  if (!fromBootstrap?.length) {
    return staticIslandConfig.enabledModules;
  }
  const merged = new Set<ModuleKey>([
    ...(fromBootstrap as ModuleKey[]),
    ...staticIslandConfig.enabledModules,
  ]);
  return Array.from(merged);
}

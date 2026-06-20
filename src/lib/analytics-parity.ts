/**
 * Webapp analytics parity checklist — mirrors mobile track() on existing web modules.
 * Mobile-only events (minibus, AdMob, profile-store, offline_search) are excluded.
 */
export const WEB_ANALYTICS_PARITY = [
  { module: 'transit', event_type: 'load', source: 'AnalyticsLifecycle.tsx' },
  { module: 'transit', event_type: 'search', source: 'features/transit/hooks.ts' },
  { module: 'transit', event_type: 'engage', source: 'features/transit/hooks.ts' },
  { module: 'transit', event_type: 'vote', source: 'features/transit/hooks.ts' },
  { module: 'transit', event_type: 'ad_impression', source: 'features/ads/' },
  { module: 'transit', event_type: 'ad_click', source: 'features/ads/' },
  { module: 'transit', event_type: 'internal_ad_impression', source: 'features/ads/' },
  { module: 'transit', event_type: 'internal_ad_click', source: 'features/ads/' },
  { module: 'transit', event_type: 'interstitial_upsell_click', source: 'features/ads/' },
  { module: 'seismic', event_type: 'view', source: 'features/earthquakes/' },
  { module: 'seismic', event_type: 'filter', source: 'features/earthquakes/' },
  { module: 'seismic', event_type: 'map_marker', source: 'features/earthquakes/' },
  { module: 'seismic', event_type: 'open', source: 'features/earthquakes/' },
  { module: 'weather', event_type: 'view', source: 'features/weather/' },
  { module: 'news', event_type: 'search', source: 'features/news/' },
  { module: 'news', event_type: 'open', source: 'features/news/' },
  { module: 'tours', event_type: 'view', source: 'features/tours/' },
  { module: 'tours', event_type: 'filter', source: 'features/tours/analytics.ts' },
  { module: 'tours', event_type: 'open', source: 'features/tours/analytics.ts' },
  { module: 'tours', event_type: 'book_click', source: 'features/tours/analytics.ts' },
  { module: 'trails', event_type: 'view', source: 'features/trails/' },
  { module: 'trails', event_type: 'filter', source: 'features/trails/analytics.ts' },
  { module: 'trails', event_type: 'engage', source: 'features/trails/' },
  { module: 'trails', event_type: 'download', source: 'features/trails/' },
  { module: 'trails', event_type: 'map_open', source: 'features/trails/' },
  { module: 'traffic', event_type: 'view', source: 'features/traffic/' },
  { module: 'traffic', event_type: 'confirm', source: 'features/traffic/' },
  { module: 'marketplace', event_type: 'view', source: 'features/marketplace/MarketplacePage.tsx' },
  { module: 'marketplace', event_type: 'search', source: 'features/marketplace/MarketplacePage.tsx' },
  { module: 'marketplace', event_type: 'share', source: 'features/marketplace/share-listing-invite.ts' },
  { module: 'marketplace', event_type: 'engage', source: 'features/marketplace/MarketplaceProviderPage.tsx' },
] as const;

export type WebAnalyticsParityEntry = (typeof WEB_ANALYTICS_PARITY)[number];

export function parityKey(entry: Pick<WebAnalyticsParityEntry, 'module' | 'event_type'>): string {
  return `${entry.module}/${entry.event_type}`;
}

/**
 * Webapp analytics parity checklist — mirrors mobile track() on existing web modules.
 * Mobile-only events (minibus, AdMob, profile-store, offline_search) are excluded.
 */
export const WEB_ANALYTICS_PARITY = [
  { module: 'transit', event_type: 'load', source: 'AnalyticsLifecycle.tsx' },
  { module: 'transit', event_type: 'search', source: 'features/transit/hooks.ts' },
  { module: 'transit', event_type: 'engage', source: 'features/transit/hooks.ts' },
  { module: 'transit', event_type: 'vote', source: 'features/transit/hooks.ts' },
  // AzoresBus changeover + the network surfaces it brought with it.
  { module: 'transit', event_type: 'schedule_preview_toggled', source: 'features/transit/components/ScheduleChangeBanner.tsx' },
  { module: 'transit', event_type: 'schedule_banner_dismissed', source: 'features/transit/components/ScheduleChangeBanner.tsx' },
  // Live vehicle tracking (free): entry card, map page and stop arrivals.
  { module: 'transit', event_type: 'live_entry_open', source: 'features/transit/live/components/LiveEntryCard.tsx' },
  { module: 'transit', event_type: 'live_view', source: 'features/transit/live/LiveMapPage.tsx' },
  { module: 'minibus', event_type: 'live_entry_open', source: 'features/minibus/live/components/MinibusLiveEntryCard.tsx' },
  { module: 'minibus', event_type: 'view', source: 'features/minibus/live/MinibusLivePage.tsx (screen: live/network/prices/schematic)' },
  { module: 'transit', event_type: 'live_filter', source: 'features/transit/live/LiveMapPage.tsx' },
  { module: 'transit', event_type: 'live_select', source: 'features/transit/live/LiveMapPage.tsx' },
  { module: 'transit', event_type: 'live_health', source: 'features/transit/live/LiveMapPage.tsx' },
  { module: 'transit', event_type: 'track_start', source: 'features/transit/tracking/tracking-store.ts' },
  { module: 'transit', event_type: 'track_stop', source: 'features/transit/tracking/tracking-store.ts' },
  { module: 'transit', event_type: 'track_pin', source: 'features/transit/tracking/tracking-store.ts' },
  { module: 'transit', event_type: 'stop_view', source: 'features/transit/StopDetailPage.tsx' },
  { module: 'transit', event_type: 'line_view', source: 'features/transit/LinePage.tsx' },
  { module: 'transit', event_type: 'network_view', source: 'features/transit/NetworkPage.tsx' },
  { module: 'transit', event_type: 'prices_view', source: 'features/transit/PricesPage.tsx' },
  { module: 'transit', event_type: 'ad_impression', source: 'features/ads/' },
  { module: 'transit', event_type: 'ad_click', source: 'features/ads/' },
  { module: 'transit', event_type: 'internal_ad_impression', source: 'features/ads/' },
  { module: 'transit', event_type: 'internal_ad_click', source: 'features/ads/' },
  { module: 'transit', event_type: 'interstitial_upsell_click', source: 'features/ads/' },
  // Third-party network tier (AdSense / fallback network) — fill rate per slot.
  { module: 'transit', event_type: 'ad_network_request', source: 'features/ads/providers/network-analytics.ts' },
  { module: 'transit', event_type: 'ad_network_filled', source: 'features/ads/providers/network-analytics.ts' },
  { module: 'transit', event_type: 'ad_network_unfilled', source: 'features/ads/providers/network-analytics.ts' },
  { module: 'transit', event_type: 'ad_network_click', source: 'features/ads/providers/network-analytics.ts' },
  // Billing: paywall_open matches the mobile event; the purchase/restore/manage names are new.
  { module: 'billing', event_type: 'paywall_open', source: 'features/premium/PremiumPage.tsx' },
  { module: 'billing', event_type: 'purchase_start', source: 'features/premium/hooks/usePremiumPurchases.ts' },
  { module: 'billing', event_type: 'purchase_success', source: 'features/premium/hooks/usePremiumPurchases.ts' },
  { module: 'billing', event_type: 'purchase_cancel', source: 'features/premium/hooks/usePremiumPurchases.ts' },
  { module: 'billing', event_type: 'purchase_error', source: 'features/premium/hooks/usePremiumPurchases.ts' },
  { module: 'billing', event_type: 'restore_click', source: 'features/premium/hooks/usePremiumPurchases.ts' },
  { module: 'billing', event_type: 'restore_result', source: 'features/premium/hooks/usePremiumPurchases.ts' },
  { module: 'billing', event_type: 'manage_click', source: 'features/premium/hooks/usePremiumManage.ts' },
  { module: 'billing', event_type: 'guest_checkout_submit', source: 'features/premium/PremiumPage.tsx' },
  { module: 'billing', event_type: 'guest_checkout_error', source: 'features/premium/PremiumPage.tsx' },
  { module: 'billing', event_type: 'set_password_success', source: 'features/premium/PremiumPage.tsx' },
  { module: 'billing', event_type: 'set_password_error', source: 'features/premium/PremiumPage.tsx' },
  // Accounts (web-only surface; mobile signs in through its own screens).
  { module: 'app', event_type: 'sign_in_open', source: 'features/account/components/SignInDialogHost.tsx' },
  { module: 'app', event_type: 'sign_in_success', source: 'features/account/components/SignInDialog.tsx' },
  { module: 'app', event_type: 'sign_in_error', source: 'features/account/components/SignInDialog.tsx' },
  { module: 'app', event_type: 'sign_out', source: 'features/account/hooks/useAuth.ts' },
  { module: 'app', event_type: 'account_delete', source: 'features/account/hooks/useAuth.ts' },
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

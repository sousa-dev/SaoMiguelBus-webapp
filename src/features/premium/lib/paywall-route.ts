export const PREMIUM_PATH = '/premium';
export const SETTINGS_PATH = '/settings';

/** Every premium CTA lands on the paywall page with its origin, for `paywall_open` analytics. */
export function premiumRoute(source: string): string {
  return `${PREMIUM_PATH}?source=${encodeURIComponent(source)}`;
}

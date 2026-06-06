import type { Platform } from '@/lib/platform';

/**
 * Native app store URLs. The real links aren't published yet — set them once via
 * the `VITE_ANDROID_APP_URL` / `VITE_IOS_APP_URL` env vars (build time) and
 * everything (banner, sidebar, store buttons) updates automatically.
 */
export const APP_LINKS = {
  android: (import.meta.env.VITE_ANDROID_APP_URL as string | undefined)?.trim() || '',
  ios: (import.meta.env.VITE_IOS_APP_URL as string | undefined)?.trim() || '',
} as const;

/** Optional iOS app id (numeric) for the native Smart App Banner meta tag. */
export const IOS_APP_ID = (import.meta.env.VITE_IOS_APP_ID as string | undefined)?.trim() || '';

/** Returns the store URL for a platform, or null when not yet configured. */
export function storeUrl(platform: Platform): string | null {
  if (platform === 'android') return APP_LINKS.android || null;
  if (platform === 'ios') return APP_LINKS.ios || null;
  return null;
}

export function hasAnyStoreLink(): boolean {
  return Boolean(APP_LINKS.android || APP_LINKS.ios);
}

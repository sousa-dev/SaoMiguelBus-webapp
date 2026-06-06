import type { Platform } from '@/lib/platform';

/**
 * Native app store URLs. Set via `VITE_ANDROID_APP_URL` / `VITE_IOS_APP_URL`
 * at build time (Docker build args on Dokploy). When unset, buttons show
 * "Coming soon" and link to the public hub site.
 */
export const APP_LINKS = {
  android: (import.meta.env.VITE_ANDROID_APP_URL as string | undefined)?.trim() || '',
  ios: (import.meta.env.VITE_IOS_APP_URL as string | undefined)?.trim() || '',
} as const;

/** Optional iOS app id (numeric) for the native Smart App Banner meta tag. */
export const IOS_APP_ID = (import.meta.env.VITE_IOS_APP_ID as string | undefined)?.trim() || '';

const baseDomain =
  (import.meta.env.VITE_BASE_DOMAIN as string | undefined)?.trim() || 'saomiguelhub.com';

/** Fallback when a store URL is not configured yet. */
export const APP_HUB_URL = `https://${baseDomain.replace(/^https?:\/\//, '')}`;

/** Returns the store URL for a platform, or null when not yet configured. */
export function storeUrl(platform: Platform): string | null {
  if (platform === 'android') return APP_LINKS.android || null;
  if (platform === 'ios') return APP_LINKS.ios || null;
  return null;
}

export function isStoreConfigured(platform: Exclude<Platform, 'desktop'>): boolean {
  return Boolean(storeUrl(platform));
}

/** Store URL when configured; otherwise the public hub site. */
export function storeLink(platform: Exclude<Platform, 'desktop'>): string {
  return storeUrl(platform) ?? APP_HUB_URL;
}

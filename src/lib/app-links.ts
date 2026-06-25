import type { Platform } from '@/lib/platform';
import { detectPlatform } from '@/lib/platform';

/** Live on the App Store — override via `VITE_IOS_APP_URL` at build time if needed. */
const DEFAULT_IOS_APP_URL =
  'https://apps.apple.com/pt/app/s%C3%A3o-miguel-bus/id6777066837';
const DEFAULT_IOS_APP_ID = '6777066837';

/** Google Play listing for São Miguel Bus / Hub (legacy package id). */
const DEFAULT_ANDROID_APP_URL =
  'https://play.google.com/store/apps/details?id=com.hsousa_apps.Autocarros';

/**
 * Native app store URLs. Set via `VITE_ANDROID_APP_URL` / `VITE_IOS_APP_URL`
 * at build time (Docker build args on Dokploy). iOS defaults to the live App
 * Store listing; Android still shows "Coming soon" until configured.
 */
export const APP_LINKS = {
  android:
    (import.meta.env.VITE_ANDROID_APP_URL as string | undefined)?.trim() ||
    DEFAULT_ANDROID_APP_URL,
  ios: (import.meta.env.VITE_IOS_APP_URL as string | undefined)?.trim() || DEFAULT_IOS_APP_URL,
} as const;

/** iOS app id (numeric) for the native Smart App Banner meta tag. */
export const IOS_APP_ID =
  (import.meta.env.VITE_IOS_APP_ID as string | undefined)?.trim() || DEFAULT_IOS_APP_ID;

const baseDomain =
  (import.meta.env.VITE_BASE_DOMAIN as string | undefined)?.trim() || 'saomiguelhub.com';

/** Fallback when a store URL is not configured yet. */
export const APP_HUB_URL = `https://${baseDomain.replace(/^https?:\/\//, '')}`;

export const TERMS_PATH = '/terms.html';
export const PRIVACY_PATH = '/privacy.html';

export const TERMS_URL = `${APP_HUB_URL}${TERMS_PATH}`;
export const PRIVACY_URL = `${APP_HUB_URL}${PRIVACY_PATH}`;

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

/** Open the native app store for the current device, or show chooser on desktop. */
export function openPremiumStore(openChooser: () => void): void {
  const platform = detectPlatform();
  if (platform === 'desktop') {
    openChooser();
    return;
  }
  window.open(storeLink(platform), '_blank', 'noopener,noreferrer');
}

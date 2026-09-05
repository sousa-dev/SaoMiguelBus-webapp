export type Platform = 'ios' | 'android' | 'desktop';

/** Best-effort client platform detection from the user agent. */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  // iPadOS 13+ reports as MacIntel with touch points.
  const iOSLike =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1);
  if (iOSLike) return 'ios';
  return 'desktop';
}

export function isMobilePlatform(): boolean {
  return detectPlatform() !== 'desktop';
}

/** Platform string sent to `/api/v1/ad` (matches mobile analytics platform). */
export function getAdPlatform(): 'ios' | 'android' | 'web' {
  const platform = detectPlatform();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}

export function getAnalyticsPlatform(): 'web' {
  return 'web';
}

export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION ?? '0.0.0';
}

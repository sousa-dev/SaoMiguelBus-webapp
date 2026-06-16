const COOKIE_EMAIL = 'premiumEmail';
const COOKIE_EXPIRES = 'premiumExpiresAt';
const COOKIE_LAST_VERIFIED = 'premiumLastVerified';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

export function getPremiumEmailFromCookie(): string | null {
  return getCookie(COOKIE_EMAIL);
}

export function clearPremiumCookies(): void {
  deleteCookie(COOKIE_EMAIL);
  deleteCookie(COOKIE_EXPIRES);
  deleteCookie(COOKIE_LAST_VERIFIED);
}

export function renewPremiumCookies(email: string, subscriptionExpiresAt: string): void {
  const subscriptionExpiry = new Date(subscriptionExpiresAt);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const cookieExpiryDays =
    subscriptionExpiry < thirtyDaysFromNow
      ? Math.max(1, Math.ceil((subscriptionExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 30;

  setCookie(COOKIE_EMAIL, email, cookieExpiryDays);
  setCookie(COOKIE_EXPIRES, subscriptionExpiresAt, cookieExpiryDays);
  setCookie(COOKIE_LAST_VERIFIED, new Date().toISOString(), cookieExpiryDays);
}

export interface SubscriptionVerifyResult {
  hasActiveSubscription: boolean;
  expiresAt?: string;
}

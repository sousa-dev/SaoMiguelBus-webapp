/**
 * The legacy PWA (and this app until accounts arrived) recognised premium by a `premiumEmail`
 * cookie verified against `/api/v1/subscription/verify`. Premium now lives on the account, and
 * registering or signing in with the same email restores it server-side
 * (`honor_legacy_entitlement`). This module retires the cookie and remembers the email for one
 * session so the UI can offer a prefilled sign-in.
 */
const LEGACY_COOKIES = ['premiumEmail', 'premiumExpiresAt', 'premiumLastVerified'];
const PENDING_KEY = 'smb_legacy_premium_email';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

function session(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

/** Removes the legacy cookies; returns the email when one was found (already pending → null). */
export function migrateLegacyPremiumCookie(): string | null {
  const raw = readCookie('premiumEmail');
  if (!raw) return null;
  for (const name of LEGACY_COOKIES) deleteCookie(name);
  const email = raw.trim().toLowerCase();
  if (!email || getPendingLegacyPremiumEmail()) return null;
  session()?.setItem(PENDING_KEY, email);
  return email;
}

export function getPendingLegacyPremiumEmail(): string | null {
  return session()?.getItem(PENDING_KEY) ?? null;
}

export function clearPendingLegacyPremiumEmail(): void {
  session()?.removeItem(PENDING_KEY);
}

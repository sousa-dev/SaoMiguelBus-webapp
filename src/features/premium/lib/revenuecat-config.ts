import { PREMIUM_ENTITLEMENT_ID_DEFAULT } from '@/features/premium/lib/revenuecat-ids';

export interface RevenueCatEnv {
  MODE?: string;
  VITE_REVENUECAT_WEB_KEY?: string;
  VITE_REVENUECAT_WEB_SANDBOX_KEY?: string;
  VITE_REVENUECAT_ENTITLEMENT_ID?: string;
}

export interface RevenueCatConfig {
  /** Web Billing public SDK key (`rcb_…` or sandbox `rcb_sb_…`), or null when purchases are off. */
  apiKey: string | null;
  sandbox: boolean;
  entitlementId: string;
}

/** Internal-only domain that always gets the sandbox key in production, so the team can test
 * live purchases anytime without a separate deploy and without ever charging a real customer. */
const INTERNAL_TEST_EMAIL_DOMAIN = 'sousadev.com';

export function isInternalTestEmail(email: string | null | undefined): boolean {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return false;
  return trimmed.endsWith(`@${INTERNAL_TEST_EMAIL_DOMAIN}`);
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Production builds use the live key for everyone, EXCEPT a signed-in `@sousadev.com` account,
 * which always gets the sandbox key (test cards, no charges) so the team can test the real,
 * deployed checkout at any time. Non-production builds (local dev, previews) keep preferring the
 * sandbox key for every user, same as before.
 */
export function resolveWebBillingApiKey(
  env: RevenueCatEnv,
  email?: string | null,
): Pick<RevenueCatConfig, 'apiKey' | 'sandbox'> {
  const production = clean(env.VITE_REVENUECAT_WEB_KEY);
  const sandbox = clean(env.VITE_REVENUECAT_WEB_SANDBOX_KEY);
  const wantsSandbox = env.MODE !== 'production' || isInternalTestEmail(email);
  if (wantsSandbox && sandbox) {
    return { apiKey: sandbox, sandbox: true };
  }
  return { apiKey: production, sandbox: false };
}

export function readRevenueCatConfig(env: RevenueCatEnv, email?: string | null): RevenueCatConfig {
  return {
    ...resolveWebBillingApiKey(env, email),
    entitlementId: clean(env.VITE_REVENUECAT_ENTITLEMENT_ID) ?? PREMIUM_ENTITLEMENT_ID_DEFAULT,
  };
}

let cached: { email: string | null; config: RevenueCatConfig } | null = null;
let cacheOverridden = false;

function resolveAndCache(key: string | null): RevenueCatConfig {
  const config = readRevenueCatConfig(
    {
      MODE: import.meta.env.MODE,
      VITE_REVENUECAT_WEB_KEY: import.meta.env.VITE_REVENUECAT_WEB_KEY as string | undefined,
      VITE_REVENUECAT_WEB_SANDBOX_KEY: import.meta.env.VITE_REVENUECAT_WEB_SANDBOX_KEY as string | undefined,
      VITE_REVENUECAT_ENTITLEMENT_ID: import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID as string | undefined,
    },
    key,
  );
  cached = { email: key, config };
  return config;
}

/** Static `import.meta.env` reads, re-resolved whenever the signed-in email changes. */
export function getRevenueCatConfig(email?: string | null): RevenueCatConfig {
  const key = email ?? null;
  if (cacheOverridden && cached) return cached.config;
  if (cached && cached.email === key) return cached.config;
  return resolveAndCache(key);
}

export function setRevenueCatConfigForTests(config: RevenueCatConfig | null): void {
  cached = config ? { email: null, config } : null;
  cacheOverridden = config != null;
}

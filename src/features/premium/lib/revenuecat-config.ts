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

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Production builds use the live key; everything else prefers the sandbox key (test cards, no charges). */
export function resolveWebBillingApiKey(env: RevenueCatEnv): Pick<RevenueCatConfig, 'apiKey' | 'sandbox'> {
  const production = clean(env.VITE_REVENUECAT_WEB_KEY);
  const sandbox = clean(env.VITE_REVENUECAT_WEB_SANDBOX_KEY);
  if (env.MODE === 'production') {
    return { apiKey: production, sandbox: false };
  }
  if (sandbox) {
    return { apiKey: sandbox, sandbox: true };
  }
  return { apiKey: production, sandbox: false };
}

export function readRevenueCatConfig(env: RevenueCatEnv): RevenueCatConfig {
  return {
    ...resolveWebBillingApiKey(env),
    entitlementId: clean(env.VITE_REVENUECAT_ENTITLEMENT_ID) ?? PREMIUM_ENTITLEMENT_ID_DEFAULT,
  };
}

let cached: RevenueCatConfig | null = null;

/** Static `import.meta.env` reads only (Vite replaces them at build time). */
export function getRevenueCatConfig(): RevenueCatConfig {
  if (!cached) {
    cached = readRevenueCatConfig({
      MODE: import.meta.env.MODE,
      VITE_REVENUECAT_WEB_KEY: import.meta.env.VITE_REVENUECAT_WEB_KEY as string | undefined,
      VITE_REVENUECAT_WEB_SANDBOX_KEY: import.meta.env.VITE_REVENUECAT_WEB_SANDBOX_KEY as
        | string
        | undefined,
      VITE_REVENUECAT_ENTITLEMENT_ID: import.meta.env.VITE_REVENUECAT_ENTITLEMENT_ID as
        | string
        | undefined,
    });
  }
  return cached;
}

export function setRevenueCatConfigForTests(config: RevenueCatConfig | null): void {
  cached = config;
}

import type { CustomerInfo, Offering, Package, Purchases } from '@revenuecat/purchases-js';

import {
  getRevenueCatConfig,
  setRevenueCatConfigForTests,
  type RevenueCatConfig,
} from '@/features/premium/lib/revenuecat-config';
import { revenueCatAppUserId } from '@/features/premium/lib/revenuecat-ids';
import type { AuthUser } from '@/lib/types';

export { setRevenueCatConfigForTests };

/**
 * The only module that touches `@revenuecat/purchases-js`. The SDK is imported lazily so it stays
 * in its own chunk and never loads for signed-out visitors, during prerendering, or in tests.
 */
type SdkModule = {
  Purchases: {
    configure: (config: { apiKey: string; appUserId: string }) => Purchases;
    isConfigured: () => boolean;
    getSharedInstance: () => Purchases;
    generateRevenueCatAnonymousAppUserId: () => string;
  };
};
type SdkLoader = () => Promise<SdkModule>;

const defaultLoader: SdkLoader = () =>
  import('@revenuecat/purchases-js') as unknown as Promise<SdkModule>;

let loadSdk: SdkLoader = defaultLoader;
let instance: Purchases | null = null;
let instanceUserId: string | null = null;
let pending: Promise<Purchases | null> | null = null;

function config(): RevenueCatConfig {
  return getRevenueCatConfig();
}

export function isRevenueCatConfigured(): boolean {
  return Boolean(config().apiKey);
}

export function isRevenueCatSandbox(): boolean {
  return config().sandbox;
}

export function revenueCatEntitlementId(): string {
  return config().entitlementId;
}

/**
 * Configure the SDK once for the signed-in account (`smb_user_<id>`), switching identity when a
 * different account signs in. Returns null when purchases are not configured.
 */
export function ensureRevenueCat(user: AuthUser): Promise<Purchases | null> {
  const { apiKey } = config();
  if (!apiKey || typeof window === 'undefined') return Promise.resolve(null);
  const appUserId = revenueCatAppUserId(user);

  if (instance && instanceUserId === appUserId) return Promise.resolve(instance);
  if (pending) return pending.then(() => ensureRevenueCat(user));

  pending = (async () => {
    if (instance) {
      await instance.changeUser(appUserId);
    } else {
      const { Purchases } = await loadSdk();
      if (Purchases.isConfigured()) {
        instance = Purchases.getSharedInstance();
        if (instanceUserId !== appUserId) await instance.changeUser(appUserId);
      } else {
        instance = Purchases.configure({ apiKey, appUserId });
      }
    }
    instanceUserId = appUserId;
    return instance;
  })();

  return pending.finally(() => {
    pending = null;
  });
}

const ANONYMOUS_ID_KEY = 'smb_rc_anonymous_id';

/**
 * Configure with a stable anonymous id so signed-out visitors can see prices. A later sign-in
 * switches to the account id via `changeUser`, which RevenueCat aliases to the anonymous one.
 */
export function ensureRevenueCatAnonymous(): Promise<Purchases | null> {
  const { apiKey } = config();
  if (!apiKey || typeof window === 'undefined') return Promise.resolve(null);
  if (instance) return Promise.resolve(instance);
  if (pending) return pending;

  pending = (async () => {
    const { Purchases } = await loadSdk();
    if (Purchases.isConfigured()) {
      instance = Purchases.getSharedInstance();
    } else {
      let appUserId = localStorage.getItem(ANONYMOUS_ID_KEY);
      if (!appUserId) {
        appUserId = Purchases.generateRevenueCatAnonymousAppUserId();
        localStorage.setItem(ANONYMOUS_ID_KEY, appUserId);
      }
      instance = Purchases.configure({ apiKey, appUserId });
      instanceUserId = appUserId;
    }
    return instance;
  })();

  return pending.finally(() => {
    pending = null;
  });
}

export function closeRevenueCat(): void {
  instance?.close();
  instance = null;
  instanceUserId = null;
}

/** The current offering, or null when it has no packages (dashboard not set up yet). */
export async function getWebOfferings(): Promise<Offering | null> {
  if (!instance) return null;
  const offerings = await instance.getOfferings();
  const current = offerings.current;
  return current && current.availablePackages.length > 0 ? current : null;
}

/** Opens RevenueCat's hosted checkout; resolves once the purchase completed. */
export async function purchaseWebPackage(pkg: Package, customerEmail: string): Promise<CustomerInfo> {
  if (!instance) throw new Error('revenuecat_not_configured');
  const result = await instance.purchase({ rcPackage: pkg, customerEmail });
  return result.customerInfo;
}

export async function getWebCustomerInfo(): Promise<CustomerInfo | null> {
  if (!instance) return null;
  return instance.getCustomerInfo();
}

export function setRevenueCatSdkLoaderForTests(loader: (() => Promise<unknown>) | null): void {
  loadSdk = (loader as SdkLoader | null) ?? defaultLoader;
}

export function resetRevenueCatForTests(): void {
  instance = null;
  instanceUserId = null;
  pending = null;
  loadSdk = defaultLoader;
  setRevenueCatConfigForTests(null);
}

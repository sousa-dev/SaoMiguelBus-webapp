// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  closeRevenueCat,
  ensureRevenueCat,
  ensureRevenueCatAnonymous,
  getWebCustomerInfo,
  getWebOfferings,
  purchaseWebPackage,
  resetRevenueCatForTests,
  setRevenueCatConfigForTests,
  setRevenueCatSdkLoaderForTests,
} from '@/features/premium/lib/revenuecat-web';

const user = { id: 7, email: 'a@b.c', displayName: 'A', dateJoined: '2026-01-01' };

function fakeSdk() {
  const instance = {
    changeUser: vi.fn(async () => ({})),
    close: vi.fn(),
    getOfferings: vi.fn(async () => ({ current: { identifier: 'default', availablePackages: [{ identifier: 'm' }] } })),
    getCustomerInfo: vi.fn(async () => ({ managementURL: 'https://portal' })),
    purchase: vi.fn(async () => ({ customerInfo: { managementURL: null } })),
  };
  const Purchases = {
    configure: vi.fn(() => instance),
    isConfigured: vi.fn(() => false),
    getSharedInstance: vi.fn(() => instance),
    generateRevenueCatAnonymousAppUserId: vi.fn(() => '$RCAnonymousID:abc'),
  };
  return { module: { Purchases }, instance, Purchases };
}

let sdk: ReturnType<typeof fakeSdk>;
const loader = vi.fn();

beforeEach(() => {
  resetRevenueCatForTests();
  sdk = fakeSdk();
  loader.mockReset();
  loader.mockResolvedValue(sdk.module);
  setRevenueCatSdkLoaderForTests(loader);
  setRevenueCatConfigForTests({ apiKey: 'rcb_sb_test', sandbox: true, entitlementId: 'Sao Miguel Hub Premium' });
});

describe('ensureRevenueCat', () => {
  it('never loads the SDK without an API key', async () => {
    setRevenueCatConfigForTests({ apiKey: null, sandbox: false, entitlementId: 'x' });
    expect(await ensureRevenueCat(user)).toBeNull();
    expect(loader).not.toHaveBeenCalled();
  });

  it('configures once per user id with the smb_user_ prefix and reuses the instance', async () => {
    const first = await ensureRevenueCat(user);
    const second = await ensureRevenueCat(user);
    expect(first).toBe(second);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(sdk.Purchases.configure).toHaveBeenCalledTimes(1);
    expect(sdk.Purchases.configure).toHaveBeenCalledWith({ apiKey: 'rcb_sb_test', appUserId: 'smb_user_7' });
  });

  it('switches identity with changeUser when another user signs in', async () => {
    await ensureRevenueCat(user);
    await ensureRevenueCat({ ...user, id: 8 });
    expect(sdk.Purchases.configure).toHaveBeenCalledTimes(1);
    expect(sdk.instance.changeUser).toHaveBeenCalledWith('smb_user_8');
  });

  it('closes and forgets the instance on closeRevenueCat', async () => {
    await ensureRevenueCat(user);
    closeRevenueCat();
    expect(sdk.instance.close).toHaveBeenCalledTimes(1);
    await ensureRevenueCat(user);
    expect(sdk.Purchases.configure).toHaveBeenCalledTimes(2);
  });
});

describe('internal-test-email sandbox switch', () => {
  it('closes the production-key instance and reconfigures fresh when a sousadev.com user signs in', async () => {
    setRevenueCatConfigForTests({ apiKey: 'rcb_prod', sandbox: false, entitlementId: 'x' });
    await ensureRevenueCat(user);
    expect(sdk.Purchases.configure).toHaveBeenCalledWith({ apiKey: 'rcb_prod', appUserId: 'smb_user_7' });

    setRevenueCatConfigForTests({ apiKey: 'rcb_sb_test', sandbox: true, entitlementId: 'x' });
    const dev = { ...user, id: 9, email: 'dev@sousadev.com' };
    await ensureRevenueCat(dev);

    expect(sdk.instance.close).toHaveBeenCalledTimes(1);
    expect(sdk.Purchases.configure).toHaveBeenCalledTimes(2);
    expect(sdk.Purchases.configure).toHaveBeenLastCalledWith({ apiKey: 'rcb_sb_test', appUserId: 'smb_user_9' });
  });
});

describe('ensureRevenueCatAnonymous', () => {
  it('configures with a persisted anonymous id and later switches to the account', async () => {
    localStorage.clear();
    await ensureRevenueCatAnonymous();
    expect(sdk.Purchases.configure).toHaveBeenCalledWith({ apiKey: 'rcb_sb_test', appUserId: '$RCAnonymousID:abc' });
    expect(localStorage.getItem('smb_rc_anonymous_id')).toBe('$RCAnonymousID:abc');
    await ensureRevenueCat(user);
    expect(sdk.instance.changeUser).toHaveBeenCalledWith('smb_user_7');
    expect(sdk.Purchases.configure).toHaveBeenCalledTimes(1);
  });
});

describe('offerings, purchase, customer info', () => {
  it('returns the current offering only when it has packages', async () => {
    await ensureRevenueCat(user);
    expect((await getWebOfferings())?.identifier).toBe('default');
    sdk.instance.getOfferings.mockResolvedValue({ current: { identifier: 'empty', availablePackages: [] } });
    expect(await getWebOfferings()).toBeNull();
  });

  it('purchases with the customer email and returns customer info', async () => {
    await ensureRevenueCat(user);
    const pkg = { identifier: 'm' } as never;
    const info = await purchaseWebPackage(pkg, 'a@b.c');
    expect(sdk.instance.purchase).toHaveBeenCalledWith({ rcPackage: pkg, customerEmail: 'a@b.c' });
    expect(info).toEqual({ managementURL: null });
  });

  it('reads customer info, and is null before configuration', async () => {
    expect(await getWebCustomerInfo()).toBeNull();
    await ensureRevenueCat(user);
    expect((await getWebCustomerInfo())?.managementURL).toBe('https://portal');
  });
});

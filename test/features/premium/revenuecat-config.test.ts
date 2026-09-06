import { describe, expect, it } from 'vitest';

import { readRevenueCatConfig, resolveWebBillingApiKey } from '@/features/premium/lib/revenuecat-config';
import {
  PREMIUM_ENTITLEMENT_ID_DEFAULT,
  REVENUECAT_APP_USER_ID_PREFIX,
  revenueCatAppUserId,
} from '@/features/premium/lib/revenuecat-ids';

describe('resolveWebBillingApiKey', () => {
  it('uses the production key in production builds', () => {
    expect(
      resolveWebBillingApiKey({
        MODE: 'production',
        VITE_REVENUECAT_WEB_KEY: 'rcb_prod',
        VITE_REVENUECAT_WEB_SANDBOX_KEY: 'rcb_sb_test',
      }),
    ).toEqual({ apiKey: 'rcb_prod', sandbox: false });
  });

  it('prefers the sandbox key outside production', () => {
    expect(
      resolveWebBillingApiKey({
        MODE: 'development',
        VITE_REVENUECAT_WEB_KEY: 'rcb_prod',
        VITE_REVENUECAT_WEB_SANDBOX_KEY: 'rcb_sb_test',
      }),
    ).toEqual({ apiKey: 'rcb_sb_test', sandbox: true });
  });

  it('falls back to the production key when no sandbox key is set', () => {
    expect(
      resolveWebBillingApiKey({ MODE: 'development', VITE_REVENUECAT_WEB_KEY: 'rcb_prod' }),
    ).toEqual({ apiKey: 'rcb_prod', sandbox: false });
  });

  it('is null when nothing is configured', () => {
    expect(resolveWebBillingApiKey({ MODE: 'production' })).toEqual({ apiKey: null, sandbox: false });
    expect(resolveWebBillingApiKey({ MODE: 'production', VITE_REVENUECAT_WEB_KEY: '  ' })).toEqual({
      apiKey: null,
      sandbox: false,
    });
  });
});

describe('readRevenueCatConfig', () => {
  it('defaults the entitlement id to the shared mobile identifier', () => {
    const config = readRevenueCatConfig({ MODE: 'production', VITE_REVENUECAT_WEB_KEY: 'rcb_p' });
    expect(config.entitlementId).toBe(PREMIUM_ENTITLEMENT_ID_DEFAULT);
    expect(config.entitlementId).toBe('Sao Miguel Hub Premium');
    expect(readRevenueCatConfig({ MODE: 'production', VITE_REVENUECAT_ENTITLEMENT_ID: 'x' }).entitlementId).toBe('x');
  });
});

describe('revenueCatAppUserId', () => {
  it('matches the prefix the API webhook expects', () => {
    expect(REVENUECAT_APP_USER_ID_PREFIX).toBe('smb_user_');
    expect(revenueCatAppUserId({ id: 42 })).toBe('smb_user_42');
  });
});

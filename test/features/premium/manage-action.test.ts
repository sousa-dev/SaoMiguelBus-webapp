import { describe, expect, it } from 'vitest';

import { NATIVE_SUBSCRIPTIONS_URL, resolveManageAction } from '@/features/premium/lib/manage-action';

describe('resolveManageAction', () => {
  it('routes web billing and stripe to the web portal', () => {
    expect(resolveManageAction({ source: 'revenuecat', manageVia: 'web' })).toEqual({ kind: 'web_portal' });
    expect(resolveManageAction({ source: 'stripe', manageVia: 'stripe' })).toEqual({ kind: 'web_portal' });
  });

  it('points store subscriptions at the native subscription pages', () => {
    expect(resolveManageAction({ source: 'revenuecat', manageVia: 'app_store' })).toEqual({
      kind: 'native_subscriptions',
      url: NATIVE_SUBSCRIPTIONS_URL.app_store,
    });
    expect(resolveManageAction({ source: 'revenuecat', manageVia: 'play_store' })).toEqual({
      kind: 'native_subscriptions',
      url: NATIVE_SUBSCRIPTIONS_URL.play_store,
    });
  });

  it('is informational for grants we manage ourselves', () => {
    expect(resolveManageAction({ source: 'legacy_email', manageVia: 'none' })).toEqual({
      kind: 'informational',
    });
    expect(resolveManageAction({ source: 'manual', manageVia: 'web' })).toEqual({ kind: 'informational' });
    expect(resolveManageAction({ source: null, manageVia: 'none' })).toEqual({ kind: 'informational' });
  });
});

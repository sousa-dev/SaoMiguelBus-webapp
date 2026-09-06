import type { EntitlementSource, ManageVia } from '@/lib/types';

export type ManageAction =
  | { kind: 'web_portal' }
  | { kind: 'native_subscriptions'; url: string }
  | { kind: 'informational' };

/** Platform-native subscription management pages, for subscriptions bought in the mobile apps. */
export const NATIVE_SUBSCRIPTIONS_URL = {
  app_store: 'https://apps.apple.com/account/subscriptions',
  play_store: 'https://play.google.com/store/account/subscriptions',
} as const;

/**
 * Decide how a user manages their subscription on the web. Legacy-email and manual grants are
 * not self-managed; store subscriptions link to the store; web billing (RevenueCat or Stripe)
 * opens the RevenueCat customer portal (`customerInfo.managementURL`).
 */
export function resolveManageAction(input: {
  source: EntitlementSource | null;
  manageVia: ManageVia;
}): ManageAction {
  const { source, manageVia } = input;
  if (source === 'legacy_email' || source === 'manual' || manageVia === 'none') {
    return { kind: 'informational' };
  }
  if (manageVia === 'app_store' || manageVia === 'play_store') {
    return { kind: 'native_subscriptions', url: NATIVE_SUBSCRIPTIONS_URL[manageVia] };
  }
  if (manageVia === 'web' || manageVia === 'stripe') {
    return { kind: 'web_portal' };
  }
  return { kind: 'informational' };
}

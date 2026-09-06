/** Must match `REVENUECAT_APP_USER_ID_PREFIX` in the API (`billing/services.py`) and the Expo app. */
export const REVENUECAT_APP_USER_ID_PREFIX = 'smb_user_';

/** Entitlement identifier shared by the iOS, Android and Web Billing apps in the RevenueCat project. */
export const PREMIUM_ENTITLEMENT_ID_DEFAULT = 'Sao Miguel Hub Premium';

/** The RevenueCat app user id for a signed-in account: the webhook maps it back to the Django user. */
export function revenueCatAppUserId(user: { id: number | string }): string {
  return `${REVENUECAT_APP_USER_ID_PREFIX}${user.id}`;
}

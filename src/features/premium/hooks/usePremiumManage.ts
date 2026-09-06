import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/features/account/auth-store';
import { resolveManageAction, type ManageAction } from '@/features/premium/lib/manage-action';
import { ensureRevenueCat, getWebCustomerInfo } from '@/features/premium/lib/revenuecat-web';
import { useEntitlement } from '@/features/premium/usePremium';
import { track } from '@/lib/analytics';
import { showNotice } from '@/lib/notice-store';

/** "Manage subscription": RevenueCat portal for web billing, store pages for mobile purchases. */
export function usePremiumManage() {
  const { t } = useTranslation();
  const entitlement = useEntitlement();
  const [busy, setBusy] = useState(false);

  const action: ManageAction = resolveManageAction({
    source: entitlement?.source ?? null,
    manageVia: entitlement?.manageVia ?? 'none',
  });

  const manage = useCallback(async () => {
    track('billing', 'manage_click', { manage_via: entitlement?.manageVia ?? 'none' });
    if (action.kind === 'native_subscriptions') {
      window.open(action.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (action.kind !== 'web_portal') return;
    const user = useAuthStore.getState().user;
    if (!user) return;
    setBusy(true);
    try {
      await ensureRevenueCat(user);
      const info = await getWebCustomerInfo();
      if (info?.managementURL) {
        window.open(info.managementURL, '_blank', 'noopener,noreferrer');
      } else {
        showNotice({ title: t('premiumManageSubscription'), message: t('premiumManageNone') });
      }
    } finally {
      setBusy(false);
    }
  }, [action, entitlement?.manageVia, t]);

  return { action, manage, busy, canManage: action.kind !== 'informational' };
}

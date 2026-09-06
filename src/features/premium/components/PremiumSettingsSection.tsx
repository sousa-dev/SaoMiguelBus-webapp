import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/features/account/auth-store';
import { openSignInDialog } from '@/features/account/lib/sign-in-dialog-store';
import { usePremiumManage } from '@/features/premium/hooks/usePremiumManage';
import { usePremiumPurchases } from '@/features/premium/hooks/usePremiumPurchases';
import { premiumRoute } from '@/features/premium/lib/paywall-route';
import { useEntitlement, usePremium } from '@/features/premium/usePremium';
import { PRIVACY_PATH, TERMS_PATH } from '@/lib/app-links';
import { formatAppDate } from '@/lib/format';
import { showNotice } from '@/lib/notice-store';
import type { ManageVia } from '@/lib/types';

const MANAGE_KEY: Record<ManageVia, string> = {
  app_store: 'premiumManageAppStore',
  play_store: 'premiumManagePlayStore',
  stripe: 'premiumManageStripe',
  web: 'premiumManageWeb',
  none: 'premiumManageNone',
};

/** Settings block mirroring the Expo `PremiumSettingsSection` row order. */
export function PremiumSettingsSection() {
  const { t } = useTranslation();
  const isPremium = usePremium();
  const entitlement = useEntitlement();
  const isSignedIn = useAuthStore((s) => Boolean(s.token));
  const manage = usePremiumManage();
  const { restore } = usePremiumPurchases({
    source: 'settings',
    onRestored: (premium) =>
      showNotice({
        title: t('premiumRestoreTitle'),
        message: premium ? t('premiumRestoreSuccess') : t('premiumRestoreNone'),
      }),
    onRestoreFailed: (key) => showNotice({ title: t('premiumRestoreTitle'), message: t(key) }),
  });
  const busy = manage.busy || restore.isPending;
  const onManage = manage.canManage ? () => void manage.manage() : undefined;
  const onRestore = () => restore.mutate();

  const subtitle = isPremium
    ? entitlement?.currentPeriodEnd
      ? `${t('premiumExpires')}${formatAppDate(entitlement.currentPeriodEnd)}`
      : t(MANAGE_KEY[entitlement?.manageVia ?? 'none'])
    : t('premiumUpsell');

  return (
    <Card as="section" className="p-5">
      <h2 className="mb-3 text-base font-bold text-content">{t('settingsPremium')}</h2>
      <div className="flex items-start gap-3">
        <Crown size={22} className="mt-0.5 shrink-0 text-accent" strokeWidth={2.5} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-content">
            {isPremium ? t('premiumActive') : t('premiumNotActive')}
          </p>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!isPremium ? (
          <Link
            to={premiumRoute('settings')}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-on-primary hover:opacity-90"
          >
            <Crown size={15} /> {t('premiumGoPremium')}
          </Link>
        ) : null}
        {isPremium && !isSignedIn ? (
          <Button size="sm" variant="secondary" onClick={() => openSignInDialog({ reason: 'premium_sync' })}>
            {t('premiumSignInToSync')}
          </Button>
        ) : null}
        {isPremium && onManage ? (
          <Button size="sm" variant="secondary" disabled={busy} onClick={onManage}>
            {t('premiumManageSubscription')}
          </Button>
        ) : null}
        {isSignedIn && onRestore ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={onRestore}>
            {t('premiumRestore')}
          </Button>
        ) : null}
      </div>

      {isPremium && !isSignedIn ? (
        <p className="mt-2 text-xs text-muted">{t('premiumSignInToSyncSubtitle')}</p>
      ) : null}

      {!isPremium ? (
        <p className="mt-4 text-xs text-muted">
          {t('premiumTerms')}{' '}
          <a href={TERMS_PATH} className="underline">
            {t('termsAndConditions')}
          </a>{' '}
          ·{' '}
          <a href={PRIVACY_PATH} className="underline">
            {t('privacyPolicy')}
          </a>
        </p>
      ) : null}
    </Card>
  );
}

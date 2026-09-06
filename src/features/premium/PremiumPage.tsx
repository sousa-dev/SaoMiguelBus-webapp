import type { Package } from '@revenuecat/purchases-js';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Ban, Crown, MapPin, Pin, ShieldCheck } from 'lucide-react';

import { PageHeader } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import { Badge, Button, Card, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/features/account/auth-store';
import { openSignInDialog } from '@/features/account/lib/sign-in-dialog-store';
import { MobileOnlyFeaturesNotice } from '@/features/premium/components/MobileOnlyFeaturesNotice';
import { usePremiumManage } from '@/features/premium/hooks/usePremiumManage';
import { usePremiumPurchases } from '@/features/premium/hooks/usePremiumPurchases';
import { useWebOfferings } from '@/features/premium/hooks/useWebOfferings';
import { packagePriceLabel, sortPackages } from '@/features/premium/lib/revenuecat-packages';
import { isRevenueCatSandbox } from '@/features/premium/lib/revenuecat-web';
import { useEntitlement, usePremium } from '@/features/premium/usePremium';
import { track } from '@/lib/analytics';
import { PRIVACY_PATH, TERMS_PATH } from '@/lib/app-links';
import { formatAppDate } from '@/lib/format';
import { showNotice } from '@/lib/notice-store';

const FEATURES = [
  { key: 'premiumFeatureAdRemoval', Icon: Ban },
  { key: 'premiumFeaturePinnedRoutes', Icon: Pin },
  { key: 'premiumFeatureBusTracking', Icon: MapPin },
  { key: 'premiumFeatureBadge', Icon: ShieldCheck },
] as const;

const PERIOD_KEY = {
  month: 'premiumPerMonth',
  year: 'premiumPerYear',
  week: 'premiumPerWeek',
  other: null,
} as const;

function PackageButton({ pkg, onSelect, busy }: { pkg: Package; onSelect: (pkg: Package) => void; busy: boolean }) {
  const { t } = useTranslation();
  const { price, period } = packagePriceLabel(pkg);
  const periodKey = PERIOD_KEY[period];
  return (
    <Button size="lg" disabled={busy} onClick={() => onSelect(pkg)} className="w-full justify-between">
      <span>{t('premiumSubscribeButton')}</span>
      <span className="font-extrabold">
        {price}
        {periodKey ? <span className="font-medium opacity-80"> / {t(periodKey)}</span> : null}
      </span>
    </Button>
  );
}

/** `/premium` — feature list, RevenueCat Web Billing packages, status/manage/restore, mobile-only notice. */
export function PremiumPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const source = params.get('source') ?? 'direct';
  const user = useAuthStore((s) => s.user);
  const isPremium = usePremium();
  const entitlement = useEntitlement();
  const offerings = useWebOfferings();
  const manage = usePremiumManage();

  const { purchase, restore } = usePremiumPurchases({
    source,
    onPurchased: () =>
      showNotice({ title: t('premiumPurchaseSuccessTitle'), message: t('premiumPurchaseSuccessMessage') }),
    onPurchaseFailed: (key) => showNotice({ title: t('premiumPurchaseErrorTitle'), message: t(key) }),
    onRestored: (premium) =>
      showNotice({
        title: t('premiumRestoreTitle'),
        message: premium ? t('premiumRestoreSuccess') : t('premiumRestoreNone'),
      }),
    onRestoreFailed: (key) => showNotice({ title: t('premiumRestoreTitle'), message: t(key) }),
  });

  const opened = useRef(false);
  const offeringSettled = offerings.isSuccess || offerings.isError;
  useEffect(() => {
    if (!offeringSettled || opened.current) return;
    opened.current = true;
    track('billing', 'paywall_open', {
      mode: 'explicit',
      variant: 'default',
      offering_id: offerings.data?.identifier ?? 'unavailable',
      source,
    });
  }, [offeringSettled, offerings.data?.identifier, source]);

  const onSubscribe = (pkg: Package) => {
    if (!user) {
      openSignInDialog({ reason: 'purchase', onSuccess: () => purchase.mutate(pkg) });
      return;
    }
    purchase.mutate(pkg);
  };

  const packages = offerings.data ? sortPackages(offerings.data.availablePackages) : [];
  const busy = purchase.isPending || restore.isPending || manage.busy;

  return (
    <>
      <Seo title={t('premiumPageTitle')} />
      <PageHeader title={t('premiumPageTitle')} subtitle={t('premiumPageDescription')} />
      <div className="flex max-w-2xl flex-col gap-4">
        <Card as="section" className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Crown size={22} className="text-accent" strokeWidth={2.5} />
            <h2 className="text-base font-bold text-content">{t('premiumFeaturesTitle')}</h2>
            {isRevenueCatSandbox() ? <Badge tone="warning">{t('premiumSandboxBadge')}</Badge> : null}
          </div>
          <ul className="flex flex-col gap-2">
            {FEATURES.map(({ key, Icon }) => (
              <li key={key} className="flex items-center gap-3 text-sm text-content">
                <Icon size={18} className="shrink-0 text-primary" />
                {t(key)}
              </li>
            ))}
          </ul>
        </Card>

        {isPremium ? (
          <Card as="section" className="p-5">
            <p className="text-sm font-bold text-content">{t('premiumActive')}</p>
            {entitlement?.currentPeriodEnd ? (
              <p className="text-xs text-muted">
                {t('premiumExpires')}
                {formatAppDate(entitlement.currentPeriodEnd)}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {manage.canManage ? (
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => void manage.manage()}>
                  {t('premiumManageSubscription')}
                </Button>
              ) : null}
              {user ? (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => restore.mutate()}>
                  {t('premiumRestore')}
                </Button>
              ) : null}
            </div>
          </Card>
        ) : (
          <Card as="section" className="p-5">
            {offerings.isPending ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : packages.length > 0 ? (
              <div className="flex flex-col gap-2">
                {packages.map((pkg) => (
                  <PackageButton key={pkg.identifier} pkg={pkg} onSelect={onSubscribe} busy={busy} />
                ))}
                {!user ? <p className="text-xs text-muted">{t('premiumSignInToBuy')}</p> : null}
                {user ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => restore.mutate()}
                    className="self-start text-xs text-muted underline-offset-2 hover:underline"
                  >
                    {t('premiumRestore')}
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted">{t('premiumOfferingUnavailable')}</p>
            )}
          </Card>
        )}

        <MobileOnlyFeaturesNotice />

        <p className="text-xs text-muted">
          {t('premiumTerms')}{' '}
          <a href={TERMS_PATH} className="underline">
            {t('termsAndConditions')}
          </a>{' '}
          ·{' '}
          <a href={PRIVACY_PATH} className="underline">
            {t('privacyPolicy')}
          </a>
        </p>
      </div>
    </>
  );
}

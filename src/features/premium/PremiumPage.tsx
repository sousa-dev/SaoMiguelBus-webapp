import type { Package } from '@revenuecat/purchases-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Check, Crown } from 'lucide-react';

import { Seo } from '@/components/Seo';
import { Badge, Button, Card, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/features/account/auth-store';
import { authErrorFromUnknown, formatAuthErrorMessage } from '@/features/account/lib/auth-errors';
import { useAuth } from '@/features/account/hooks/useAuth';
import { openSignInDialog } from '@/features/account/lib/sign-in-dialog-store';
import { GuestCheckoutDialog } from '@/features/premium/components/GuestCheckoutDialog';
import { MobileOnlyFeaturesNotice } from '@/features/premium/components/MobileOnlyFeaturesNotice';
import { SetPasswordDialog } from '@/features/premium/components/SetPasswordDialog';
import { usePremiumManage } from '@/features/premium/hooks/usePremiumManage';
import { usePremiumPurchases } from '@/features/premium/hooks/usePremiumPurchases';
import { useWebOfferings } from '@/features/premium/hooks/useWebOfferings';
import { packageDurationLabel, packageTrialDays } from '@/features/premium/lib/package-display';
import type { BillingPeriod } from '@/features/premium/lib/revenuecat-packages';
import { packagePriceWithPeriodLabel, sortPackages } from '@/features/premium/lib/revenuecat-packages';
import { isRevenueCatSandbox } from '@/features/premium/lib/revenuecat-web';
import { useEntitlement, usePremium } from '@/features/premium/usePremium';
import { track } from '@/lib/analytics';
import { PRIVACY_PATH, TERMS_PATH } from '@/lib/app-links';
import { formatAppDate } from '@/lib/format';
import { showNotice } from '@/lib/notice-store';

// Exact copy and order from the mobile paywall (RevenueCat-hosted) — see
// `premiumFeatureOfflineSchedules`/`premiumFeatureArrivalNotifications` below,
// which are mobile-only today; `MobileOnlyFeaturesNotice` further down the
// page is what clarifies that, matching how mobile's own paywall doesn't
// distinguish them either (every feature here is real, just not all of them
// ship on web yet).
const FEATURES = [
  'premiumFeature1',
  'premiumFeatureOfflineSchedules',
  'premiumFeatureLiveLocation',
  'premiumFeaturePinRoutesDaily',
  'premiumFeatureArrivalNotifications',
] as const;

function PackageTile({
  pkg,
  selected,
  onSelect,
}: {
  pkg: Package;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const periodUnitLabel = (period: BillingPeriod): string | null => {
    switch (period) {
      case 'week':
        return t('premiumPricePeriodWeek');
      case 'month':
        return t('premiumPricePeriodMonth');
      case 'year':
        return t('premiumPricePeriodYear');
      default:
        return null;
    }
  };
  const price = packagePriceWithPeriodLabel(pkg, periodUnitLabel);
  const duration = packageDurationLabel(pkg);
  const trialDays = packageTrialDays(pkg);
  const durationLabel =
    duration.unit === 'days' ? t('premiumDurationDays', { count: duration.value }) : t('premiumDurationMonths', { count: duration.value });

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 p-3 pt-4 text-center transition ${
        selected ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-outline'
      }`}
    >
      {selected ? (
        <span className="absolute -top-2.5 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
          <Check size={12} strokeWidth={3} />
        </span>
      ) : null}
      {trialDays ? (
        <Badge tone="success" className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px]">
          {t('premiumFreeTrialDays', { count: trialDays })}
        </Badge>
      ) : null}
      <span className="text-2xl font-extrabold text-content">{duration.value}</span>
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{durationLabel}</span>
      <span className="mt-1 text-xs font-bold text-content">{price}</span>
    </button>
  );
}

/** `/premium` — a mobile-style tiered paywall backed by RevenueCat Web Billing. */
export function PremiumPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const source = params.get('source') ?? 'direct';
  const user = useAuthStore((s) => s.user);
  const isPremium = usePremium();
  const entitlement = useEntitlement();
  const offerings = useWebOfferings();
  const manage = usePremiumManage();
  const { registerGuest, setPassword: setPasswordMutation } = useAuth();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const pendingPackage = useRef<Package | null>(null);
  const guestCreated = useRef(false);
  const [guestEmail, setGuestEmail] = useState('');

  const { purchase, restore } = usePremiumPurchases({
    source,
    onPurchased: () => {
      if (guestCreated.current) {
        guestCreated.current = false;
        setSetPasswordOpen(true);
        return;
      }
      showNotice({ title: t('premiumPurchaseSuccessTitle'), message: t('premiumPurchaseSuccessMessage') });
    },
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

  const packages = useMemo(() => (offerings.data ? sortPackages(offerings.data.availablePackages) : []), [offerings.data]);

  // Default to the trial package if one exists, else the first (monthly-first-sorted) package —
  // derived at render time rather than via an effect, so there is no extra render round-trip.
  const defaultPackage = useMemo(
    () => packages.find((pkg) => packageTrialDays(pkg) != null) ?? packages[0] ?? null,
    [packages],
  );
  const selectedPackage = (selectedId ? packages.find((pkg) => pkg.identifier === selectedId) : null) ?? defaultPackage;
  const busy = purchase.isPending || restore.isPending || manage.busy || registerGuest.isPending;

  const onContinue = () => {
    if (!selectedPackage) return;
    if (user) {
      purchase.mutate(selectedPackage);
      return;
    }
    pendingPackage.current = selectedPackage;
    setGuestError(null);
    setGuestOpen(true);
  };

  const onGuestSubmit = async (email: string) => {
    setGuestError(null);
    try {
      await registerGuest.mutateAsync({ email });
      guestCreated.current = true;
      setGuestEmail(email);
      setGuestOpen(false);
      if (pendingPackage.current) purchase.mutate(pendingPackage.current);
    } catch (caught) {
      const ui = authErrorFromUnknown(caught);
      if (ui.code === 'email_taken') {
        setGuestOpen(false);
        openSignInDialog({
          reason: 'purchase',
          prefillEmail: email,
          onSuccess: () => {
            if (pendingPackage.current) purchase.mutate(pendingPackage.current);
          },
        });
        return;
      }
      setGuestError(formatAuthErrorMessage(ui, t) || t('premiumGuestCheckoutError'));
    }
  };

  const onSetPasswordSubmit = async (password: string) => {
    setSetPasswordError(null);
    try {
      await setPasswordMutation.mutateAsync({ password });
      setSetPasswordOpen(false);
      showNotice({
        title: t('premiumSetPasswordSuccessTitle'),
        message: t('premiumSetPasswordSuccessMessage'),
      });
    } catch (caught) {
      const ui = authErrorFromUnknown(caught);
      setSetPasswordError(formatAuthErrorMessage(ui, t));
    }
  };

  return (
    <>
      <Seo title={t('premiumPageTitle')} />
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-on-primary shadow-lg">
          <Crown size={30} strokeWidth={2} />
        </span>
        <h1 className="text-2xl font-extrabold text-content">{t('getPremiumTitle')}</h1>
        <p className="rounded-full bg-success-surface px-3 py-1 text-xs font-semibold text-success">
          {t('premiumBonusBanner')}
        </p>
        <p className="text-sm text-muted">{t('premiumSubscribeSubtitle')}</p>

        {isPremium ? (
          <Card as="section" className="w-full p-5 text-left">
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
          <>
            <ul className="flex w-full flex-col gap-2 text-left">
              {FEATURES.map((key) => (
                <li key={key} className="flex items-center gap-3 text-sm text-content">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-white">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {t(key)}
                </li>
              ))}
            </ul>

            {offerings.isPending ? (
              <div className="flex w-full gap-2">
                <Skeleton className="h-24 flex-1" />
                <Skeleton className="h-24 flex-1" />
                <Skeleton className="h-24 flex-1" />
              </div>
            ) : packages.length > 0 ? (
              <>
                <div className="flex w-full items-stretch gap-2 pt-2">
                  {packages.map((pkg) => (
                    <PackageTile
                      key={pkg.identifier}
                      pkg={pkg}
                      selected={pkg.identifier === selectedPackage?.identifier}
                      onSelect={() => setSelectedId(pkg.identifier)}
                    />
                  ))}
                </div>
                {isRevenueCatSandbox() ? <Badge tone="warning">{t('premiumSandboxBadge')}</Badge> : null}
                <p className="text-xs text-muted">{t('premiumAutoRenewDisclaimer')}</p>
                <Button size="lg" className="w-full" disabled={busy || !selectedPackage} onClick={onContinue}>
                  {selectedPackage && packageTrialDays(selectedPackage) != null
                    ? t('premiumStartTrialButton')
                    : t('premiumContinueButton')}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted">{t('premiumOfferingUnavailable')}</p>
            )}
          </>
        )}

        <MobileOnlyFeaturesNotice />

        <p className="text-xs text-muted">
          {user ? (
            <>
              <button type="button" disabled={busy} onClick={() => restore.mutate()} className="underline-offset-2 hover:underline">
                {t('premiumRestore')}
              </button>
              {' · '}
            </>
          ) : null}
          <a href={TERMS_PATH} className="underline-offset-2 hover:underline">
            {t('termsAndConditions')}
          </a>{' '}
          ·{' '}
          <a href={PRIVACY_PATH} className="underline-offset-2 hover:underline">
            {t('privacyPolicy')}
          </a>
        </p>
      </div>

      <GuestCheckoutDialog
        open={guestOpen}
        pending={registerGuest.isPending}
        error={guestError}
        onClose={() => setGuestOpen(false)}
        onSubmit={onGuestSubmit}
      />
      <SetPasswordDialog
        open={setPasswordOpen}
        email={guestEmail}
        pending={setPasswordMutation.isPending}
        error={setPasswordError}
        onClose={() => setSetPasswordOpen(false)}
        onSkip={() => setSetPasswordOpen(false)}
        onSubmit={onSetPasswordSubmit}
      />
    </>
  );
}

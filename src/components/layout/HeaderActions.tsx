import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Crown, Settings, UserCircle } from 'lucide-react';

import { LanguagePicker } from '@/components/layout/LanguagePicker';
import { useAuthStore } from '@/features/account/auth-store';
import { openSignInDialog } from '@/features/account/lib/sign-in-dialog-store';
import { premiumRoute, SETTINGS_PATH } from '@/features/premium/lib/paywall-route';
import { usePremium } from '@/features/premium/usePremium';
import { cn } from '@/lib/cn';

const iconButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-content transition hover:border-outline';

/** Crown pill: premium → settings, free → paywall. Mirrors the Expo `PremiumHeaderButton`. */
export function PremiumHeaderButton() {
  const { t } = useTranslation();
  const isPremium = usePremium();
  return (
    <Link
      to={isPremium ? SETTINGS_PATH : premiumRoute('header')}
      className={cn(
        'inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition',
        isPremium
          ? 'bg-accent/20 text-on-accent hover:bg-accent/30'
          : 'border border-accent/60 bg-surface text-content hover:bg-accent/10',
      )}
    >
      <Crown size={17} strokeWidth={2.5} className="text-accent" />
      <span className="hidden sm:inline">
        {isPremium ? t('premiumHeaderButtonActive') : t('removeAdsButton')}
      </span>
    </Link>
  );
}

/** Right side of the shell header: premium, account, settings, language. */
export function HeaderActions() {
  const { t } = useTranslation();
  const isSignedIn = useAuthStore((s) => Boolean(s.token));

  return (
    <div className="ml-auto flex items-center gap-2">
      <PremiumHeaderButton />
      {isSignedIn ? (
        <Link to={SETTINGS_PATH} data-testid="header-account" className={iconButtonClass}>
          <UserCircle size={19} />
          <span className="sr-only">{t('authTitle')}</span>
        </Link>
      ) : (
        <button
          type="button"
          data-testid="header-account"
          onClick={() => openSignInDialog({ reason: 'header' })}
          className={iconButtonClass}
        >
          <UserCircle size={19} />
          <span className="sr-only">{t('authSignIn')}</span>
        </button>
      )}
      <Link to={SETTINGS_PATH} className={cn(iconButtonClass, 'hidden sm:inline-flex')}>
        <Settings size={19} />
        <span className="sr-only">{t('settingsTitle')}</span>
      </Link>
      <LanguagePicker />
    </div>
  );
}

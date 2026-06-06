import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone, X } from 'lucide-react';

import { cn } from '@/lib/cn';
import { detectPlatform, type Platform } from '@/lib/platform';
import { isStoreConfigured, storeLink } from '@/lib/app-links';

const DISMISS_KEY = 'smb_install_banner_dismissed';
const MOBILE_MEDIA = '(max-width: 1023px)';

function useMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MEDIA).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

function mobileStorePlatform(): Exclude<Platform, 'desktop'> {
  const platform = detectPlatform();
  return platform === 'desktop' ? 'android' : platform;
}

function StoreBadge({
  platform,
  className,
}: {
  platform: Exclude<Platform, 'desktop'>;
  className?: string;
}) {
  const { t } = useTranslation();
  const configured = isStoreConfigured(platform);
  const href = storeLink(platform);
  const badgeSrc = platform === 'ios' ? '/badges/app-store.svg' : '/badges/google-play.svg';
  const badgeAlt = platform === 'ios' ? t('appInstallIos') : t('appInstallAndroid');

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn('relative block w-full max-w-[220px] transition hover:opacity-90', className)}
      aria-label={configured ? badgeAlt : `${badgeAlt} — ${t('appInstallComingSoon')}`}
    >
      <img src={badgeSrc} alt="" className={cn('h-12 w-full object-contain', !configured && 'opacity-55')} />
      {!configured ? (
        <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/45 px-2 text-center text-xs font-bold uppercase tracking-wide text-white">
          {t('appInstallComingSoon')}
        </span>
      ) : null}
    </a>
  );
}

/** Prominent, dismissible install prompt shown on phones (Android/iOS specific). */
export function AppInstallBanner() {
  const { t } = useTranslation();
  const isMobileViewport = useMobileViewport();
  const platform = useMemo(() => mobileStorePlatform(), []);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!isMobileViewport || dismissed) return null;

  const body = platform === 'ios' ? t('appInstallBodyIos') : t('appInstallBodyAndroid');

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-surface px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] lg:hidden">
      <div className="flex items-start gap-3">
        <img src="/logo.png" alt="" className="h-12 w-12 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-content">{t('appInstallTitle')}</p>
          <p className="text-xs text-muted">{body}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('appInstallDismiss')}
          className="shrink-0 rounded-lg p-1 text-muted hover:bg-surface-variant"
        >
          <X size={18} />
        </button>
      </div>
      <div className="mt-3 flex justify-center">
        <StoreBadge platform={platform} />
      </div>
    </div>
  );
}

/** Subtle "get the app" card for the desktop sidebar footer. */
export function GetTheAppCard() {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-border bg-surface-variant p-3">
      <div className="mb-2 flex items-center gap-2">
        <Smartphone size={16} className="text-primary" />
        <p className="text-sm font-bold text-content">{t('appInstallGetApp')}</p>
      </div>
      <p className="mb-3 text-xs text-muted">{t('appInstallDesktopBody')}</p>
      <div className="flex flex-col items-center gap-2">
        <StoreBadge platform="ios" />
        <StoreBadge platform="android" />
      </div>
    </div>
  );
}

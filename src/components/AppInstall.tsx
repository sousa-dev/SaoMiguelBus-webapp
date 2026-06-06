import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Apple, Smartphone, X } from 'lucide-react';

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

function StoreButton({
  platform,
  className,
}: {
  platform: Exclude<Platform, 'desktop'>;
  className?: string;
}) {
  const { t } = useTranslation();
  const configured = isStoreConfigured(platform);
  const href = storeLink(platform);
  const Icon = platform === 'ios' ? Apple : Smartphone;
  const storeLabel = platform === 'ios' ? t('appInstallIos') : t('appInstallAndroid');

  const inner = configured ? (
    <>
      <Icon size={18} />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-medium opacity-80">{t('appInstallStorePrefix')}</span>
        <span className="text-sm font-bold">{storeLabel}</span>
      </span>
    </>
  ) : (
    <>
      <Icon size={18} />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-medium opacity-80">{storeLabel}</span>
        <span className="text-sm font-bold">{t('appInstallComingSoon')}</span>
      </span>
    </>
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-white transition hover:opacity-90',
        !configured && 'border border-white/25 bg-secondary/80',
        className,
      )}
    >
      {inner}
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
      <div className="mt-3 flex">
        <StoreButton platform={platform} className="w-full justify-center" />
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
      <div className="flex flex-col gap-2">
        <StoreButton platform="ios" className="w-full justify-center py-1.5" />
        <StoreButton platform="android" className="w-full justify-center py-1.5" />
      </div>
    </div>
  );
}

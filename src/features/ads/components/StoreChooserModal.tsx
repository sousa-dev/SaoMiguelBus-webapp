import { useTranslation } from 'react-i18next';
import { Apple, Smartphone, X } from 'lucide-react';

import { useStoreChooserStore } from '@/features/ads/lib/store-chooser-store';
import { isStoreConfigured, storeLink } from '@/lib/app-links';
import { cn } from '@/lib/cn';

function StoreButton({
  platform,
  className,
}: {
  platform: 'ios' | 'android';
  className?: string;
}) {
  const { t } = useTranslation();
  const configured = isStoreConfigured(platform);
  const href = storeLink(platform);
  const Icon = platform === 'ios' ? Apple : Smartphone;
  const storeLabel = platform === 'ios' ? t('appInstallIos') : t('appInstallAndroid');

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
      <Icon size={18} />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-medium opacity-80">{t('appInstallStorePrefix')}</span>
        <span className="text-sm font-bold">
          {configured ? storeLabel : t('appInstallComingSoon')}
        </span>
      </span>
    </a>
  );
}

/** Desktop chooser when premium CTA cannot infer a single store. */
export function StoreChooserModal() {
  const { t } = useTranslation();
  const open = useStoreChooserStore((s) => s.open);
  const hide = useStoreChooserStore((s) => s.hide);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1350] flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-bold text-content">{t('removeAdsTitle')}</p>
            <p className="mt-1 text-sm text-muted">{t('appInstallDesktopBody')}</p>
          </div>
          <button
            type="button"
            onClick={hide}
            aria-label={t('close', { defaultValue: 'Close' })}
            className="rounded-lg p-1 text-muted hover:bg-surface-variant"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <StoreButton platform="ios" className="w-full justify-center" />
          <StoreButton platform="android" className="w-full justify-center" />
        </div>
      </div>
    </div>
  );
}

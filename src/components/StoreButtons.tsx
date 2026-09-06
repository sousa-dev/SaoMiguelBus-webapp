import { useTranslation } from 'react-i18next';
import { Apple, Smartphone } from 'lucide-react';

import { isStoreConfigured, storeLink } from '@/lib/app-links';
import { cn } from '@/lib/cn';

export function StoreButton({
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
        <span className="text-sm font-bold">{configured ? storeLabel : t('appInstallComingSoon')}</span>
      </span>
    </a>
  );
}

/** Both store buttons side by side (stacked on narrow screens). */
export function StoreButtons({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row', className)}>
      <StoreButton platform="ios" className="justify-center" />
      <StoreButton platform="android" className="justify-center" />
    </div>
  );
}

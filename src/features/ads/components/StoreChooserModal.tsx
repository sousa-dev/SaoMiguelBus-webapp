import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

import { useStoreChooserStore } from '@/features/ads/lib/store-chooser-store';
import { StoreButton } from '@/components/StoreButtons';

/** Desktop chooser when premium CTA cannot infer a single store. */
export function StoreChooserModal() {
  const { t } = useTranslation();
  const open = useStoreChooserStore((s) => s.open);
  const content = useStoreChooserStore((s) => s.content);
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
            <p className="text-base font-bold text-content">{content?.title ?? t('removeAdsTitle')}</p>
            <p className="mt-1 text-sm text-muted">{content?.body ?? t('appInstallDesktopBody')}</p>
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

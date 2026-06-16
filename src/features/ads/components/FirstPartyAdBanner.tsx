import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AdPayload } from '@/lib/types';

type Props = {
  ad: AdPayload;
  onOpen: () => void;
};

export function FirstPartyAdBanner({ ad, onOpen }: Props) {
  const { t } = useTranslation();
  const [aspectRatio, setAspectRatio] = useState(4);

  useEffect(() => {
    if (!ad.media) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled && img.width > 0 && img.height > 0) {
        setAspectRatio(img.width / img.height);
      }
    };
    img.src = ad.media;
    return () => {
      cancelled = true;
    };
  }, [ad.media]);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ad.entity || t('transitAdLabel')}
      title={t('transitAdAccessibilityHint')}
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <span className="absolute left-0 top-0 z-10 rounded-br-lg bg-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-primary">
        {t('transitAdLabel')}
      </span>
      <img
        src={ad.media}
        alt={ad.entity || t('transitAdLabel')}
        className="w-full object-cover"
        style={{ aspectRatio }}
      />
    </button>
  );
}

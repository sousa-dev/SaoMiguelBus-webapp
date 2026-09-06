import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio } from 'lucide-react';

import { Spinner } from '@/components/ui';
import { azoresbusFreshnessLabels } from '@/features/transit/live/lib/trackingFreshness';

type Props = {
  /** react-query's `dataUpdatedAt`; undefined until the first response lands. */
  updatedAt?: number;
  isRefetching?: boolean;
};

/**
 * The AO VIVO pill plus a client-derived "updated at · every 60s" caption. Never null: the pill
 * is what tells a rider the dots move on their own, and it has to be on screen from the first
 * frame. Only the caption waits for something real to say.
 */
export function TrackingFreshness({ updatedAt, isRefetching = false }: Props) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // Reads the clock only when a fresh answer lands, so the caption reflects real fetch times.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, [updatedAt]);
  const labels = useMemo(
    () =>
      azoresbusFreshnessLabels(
        updatedAt,
        {
          intervalSeconds: (count) => t('azoresbusLiveUpdateIntervalSeconds', { count }),
          intervalMinutes: (count) => t('azoresbusLiveUpdateIntervalMinutes', { count }),
        },
        now,
        i18n.language,
      ),
    [i18n.language, now, t, updatedAt],
  );

  return (
    <div className="flex items-center justify-between gap-2 text-xs text-muted">
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-danger px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
          <Radio size={10} strokeWidth={2.5} />
          {t('azoresbusLiveCta')}
        </span>
        <span className="truncate">
          {labels?.updatedAtTime ? t('azoresbusLiveLastUpdated', { time: labels.updatedAtTime }) : null}
          {labels?.updatedAtTime && labels?.intervalTime ? ' · ' : null}
          {labels?.intervalTime ? t('azoresbusLiveUpdateInterval', { interval: labels.intervalTime }) : null}
        </span>
      </div>
      {isRefetching ? (
        <span className="inline-flex shrink-0 items-center gap-1">
          <Spinner className="h-3 w-3" />
          {t('azoresbusLiveUpdating')}
        </span>
      ) : null}
    </div>
  );
}

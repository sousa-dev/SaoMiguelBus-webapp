import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bus, Radio, WifiOff } from 'lucide-react';

import { Skeleton } from '@/components/ui';
import { useLiveVehicleCounts } from '@/features/live/hooks/useLiveVehicleCounts';
import { resolveLiveCount } from '@/features/live/lib/liveCounts';
import { isLiveEntryEnabled } from '@/features/live/lib/liveEntryVisibility';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';

export const MINIBUS_LIVE_PATH = '/minibus/live';

/** The PDL MiniBus "live" entry; hidden when this deployment has no minibus feed at all. */
export function MinibusLiveEntryCard({ isOnline, source = 'minibus_hub' }: { isOnline: boolean; source?: string }) {
  const { t } = useTranslation();
  const counts = useLiveVehicleCounts({ enabled: isOnline });
  const entry = counts.data?.minibus;
  if (counts.isSuccess && entry === null) return null;

  const resolved = resolveLiveCount(entry);
  const enabled = isLiveEntryEnabled(isOnline, resolved.available);
  const subtitle =
    enabled && resolved.count != null
      ? t('minibusLiveVehiclesCount', { count: resolved.count })
      : !isOnline
        ? t('minibusLiveOfflineShort')
        : !enabled
          ? t('minibusLiveUnavailableShort')
          : null;

  return (
    <Link
      to={MINIBUS_LIVE_PATH}
      aria-disabled={enabled ? undefined : 'true'}
      onClick={() => track('minibus', 'live_entry_open', { source })}
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/[0.03] transition hover:bg-surface-variant',
        !enabled && 'opacity-55',
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f47216] text-white">
        {isOnline ? <Radio size={18} strokeWidth={2} /> : <WifiOff size={18} strokeWidth={2} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-content">{t('minibusLiveCta')}</span>
        {counts.isPending && enabled ? (
          <Skeleton className="mt-1 h-3 w-20" />
        ) : subtitle ? (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            {enabled ? <Bus size={12} /> : null}
            <span className="truncate">{subtitle}</span>
          </span>
        ) : (
          <span className="block text-xs text-muted">{t('minibusLiveCtaHint')}</span>
        )}
      </span>
    </Link>
  );
}

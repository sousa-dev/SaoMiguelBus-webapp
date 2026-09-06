import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bus, Radio, WifiOff } from 'lucide-react';

import { Skeleton } from '@/components/ui';
import { useLiveVehicleCounts } from '@/features/live/hooks/useLiveVehicleCounts';
import { resolveLiveCount } from '@/features/live/lib/liveCounts';
import { isLiveEntryEnabled } from '@/features/live/lib/liveEntryVisibility';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';

export const LIVE_MAP_PATH = '/transit/live';

type Props = {
  /** The island's `trackingEnabled` bootstrap flag: does the feature exist at all. */
  showTracking: boolean;
  isOnline: boolean;
  source?: string;
};

/**
 * The "Ao vivo" entry on the transit home (mirrors the Expo `AzoresbusLiveHubCard`). Always
 * rendered while the feature exists, even when the feed is down: a control that vanishes reads
 * as a feature taken away. Only the caption and greyed icon change; the live page explains.
 */
export function LiveEntryCard({ showTracking, isOnline, source = 'transit_hub' }: Props) {
  const { t } = useTranslation();
  const counts = useLiveVehicleCounts({ enabled: showTracking && isOnline });
  const resolved = resolveLiveCount(counts.data?.azoresbus);
  const enabled = isLiveEntryEnabled(isOnline, resolved.available);

  if (!showTracking) return null;

  const subtitle =
    enabled && resolved.count != null
      ? t('azoresbusLiveVehiclesCount', { count: resolved.count })
      : !isOnline
        ? t('azoresbusLiveOfflineShort')
        : !enabled
          ? t('azoresbusLiveUnavailableShort')
          : null;

  return (
    <Link
      to={LIVE_MAP_PATH}
      aria-disabled={enabled ? undefined : 'true'}
      aria-label={`${t('azoresbusLiveCta')}. ${
        enabled ? t('azoresbusLiveCtaHint') : isOnline ? t('azoresbusLiveUnavailableHint') : t('azoresbusLiveOfflineHint')
      }`}
      onClick={() => track('transit', 'live_entry_open', { source })}
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm shadow-black/[0.03] transition hover:bg-surface-variant',
        !enabled && 'opacity-55',
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
        {isOnline ? <Radio size={18} strokeWidth={2} /> : <WifiOff size={18} strokeWidth={2} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-content">{t('azoresbusLiveCta')}</span>
        {counts.isPending && enabled ? (
          <Skeleton className="mt-1 h-3 w-20" />
        ) : subtitle ? (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            {enabled ? <Bus size={12} /> : null}
            <span className="truncate">{subtitle}</span>
          </span>
        ) : null}
      </span>
    </Link>
  );
}

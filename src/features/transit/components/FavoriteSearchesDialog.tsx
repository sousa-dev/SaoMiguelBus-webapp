import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, X } from 'lucide-react';

import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/cn';
import { splitStopLabel } from '@/lib/format';
import { useProfileStore } from '@/lib/store';

type FavoriteRoute = { origin: string; destination: string };

/**
 * A route drawn the way the app draws a journey leg: hollow dot for where the
 * rider gets on, rail, solid dot for where they get off.
 *
 * A single truncated `A → B` line made the two endpoints compete for the same
 * width, so a long origin ate the destination — the half that actually tells
 * two saved routes apart. Stacking gives each endpoint its own line to truncate
 * in, and says "from/to" without spending a word on it.
 */
function RouteDiagram({
  from,
  to,
  compact = false,
}: {
  from: { title: string; subtitle: string | null };
  to: { title: string; subtitle: string | null };
  compact?: boolean;
}) {
  return (
    <span className={cn('relative flex flex-col', compact ? 'gap-1.5' : 'gap-2')}>
      {/* The rail runs between the two dots, not past them. */}
      <span
        aria-hidden
        className={cn(
          'absolute w-px bg-border',
          compact ? 'bottom-[7px] left-[2.5px] top-[7px]' : 'bottom-[9px] left-[3.5px] top-[9px]',
        )}
      />
      <Endpoint label={from} tone="origin" compact={compact} />
      <Endpoint label={to} tone="destination" compact={compact} />
    </span>
  );
}

function Endpoint({
  label,
  tone,
  compact,
}: {
  label: { title: string; subtitle: string | null };
  tone: 'origin' | 'destination';
  compact: boolean;
}) {
  return (
    <span className={cn('relative flex items-center', compact ? 'gap-2' : 'gap-3')}>
      <span
        aria-hidden
        className={cn(
          'z-10 shrink-0 rounded-full',
          compact ? 'h-1.5 w-1.5' : 'h-2 w-2',
          tone === 'origin'
            ? cn('bg-surface', compact ? 'border border-muted' : 'border-2 border-muted')
            : 'bg-primary',
        )}
      />
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          compact ? 'text-xs font-medium text-muted' : 'text-sm font-semibold text-content',
        )}
      >
        {label.title}
        {label.subtitle && !compact ? (
          <span className="font-normal text-muted"> · {label.subtitle}</span>
        ) : null}
      </span>
    </span>
  );
}

/**
 * One saved pair, offered both ways round.
 *
 * A rider who saves the trip out almost always wants the trip back, and saving
 * it twice to get it is busywork the app can do for them. The saved direction
 * leads at full weight; the return rides alongside it, quieter and smaller, so
 * the card still reads as one saved route rather than two.
 */
function FavoriteRow({
  origin,
  destination,
  onSelect,
  onRemove,
}: {
  origin: string;
  destination: string;
  onSelect: (origin: string, destination: string) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const from = splitStopLabel(origin);
  const to = splitStopLabel(destination);

  return (
    <div className="flex items-stretch rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => onSelect(origin, destination)}
        className="min-w-0 flex-[1.3] rounded-l-xl px-3 py-3 text-left transition hover:bg-surface-variant"
        aria-label={`${from.title} → ${to.title}`}
      >
        <RouteDiagram from={from} to={to} />
      </button>
      <span aria-hidden className="my-2 w-px shrink-0 bg-border" />
      <button
        type="button"
        onClick={() => onSelect(destination, origin)}
        className="min-w-0 flex-1 px-3 py-3 text-left transition hover:bg-surface-variant"
        aria-label={`${to.title} → ${from.title}`}
      >
        <RouteDiagram from={to} to={from} compact />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('removeFavorites')}
        className="shrink-0 rounded-r-xl px-2 text-muted transition hover:bg-border hover:text-content"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/**
 * The saved searches, reachable from an EMPTY planner.
 *
 * They used to live in a panel below the results, which meant a rider could only
 * open the list once they had already typed the search the list exists to save
 * them from typing. A modal off the planner is the whole point of the feature.
 */
export function FavoriteSearchesButton({
  onSelect,
  className,
}: {
  onSelect: (origin: string, destination: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const favoriteRoutes = useProfileStore((s) => s.favoriteRoutes);
  const toggleFavoriteRoute = useProfileStore((s) => s.toggleFavoriteRoute);
  const [open, setOpen] = useState(false);
  /** The route the rider asked to drop, held until they say yes. */
  const [confirming, setConfirming] = useState<FavoriteRoute | null>(null);

  const pick = (origin: string, destination: string) => {
    setOpen(false);
    onSelect(origin, destination);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-content hover:bg-surface-variant',
          className,
        )}
      >
        <Star size={15} className="text-accent" />
        <span className="truncate">{t('favoriteSearches')}</span>
        {/* Always shown, zero included: the count is what says whether the
            dialog holds anything, before the rider spends a tap finding out. */}
        <span className="rounded-full bg-surface-variant px-1.5 text-xs font-bold text-muted">
          {favoriteRoutes.length}
        </span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={t('favoriteSearches')}>
        {favoriteRoutes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Star size={24} className="text-border" />
            <p className="text-sm text-muted">{t('noFavoriteSearches')}</p>
          </div>
        ) : (
          <>
            {/* Said once for the list, not repeated on every card — the rows
                are identical in kind, so the instruction is about the list. */}
            <p className="-mt-1 mb-3 text-xs text-muted">{t('favoriteSearchHint')}</p>
            <div className="-mx-1 flex max-h-[60vh] flex-col gap-2 overflow-y-auto px-1 py-1">
              {favoriteRoutes.map((route, index) => (
                <FavoriteRow
                  key={`${route.origin}-${route.destination}-${index}`}
                  origin={route.origin}
                  destination={route.destination}
                  onSelect={pick}
                  onRemove={() => setConfirming(route)}
                />
              ))}
            </div>
          </>
        )}
      </Dialog>

      {/* A favourite is a handful of taps to rebuild and nothing warns you it
          has gone, so the ✕ asks first. */}
      <ConfirmDialog
        open={confirming !== null}
        title={t('removeFavorites')}
        message={t('confirmRemoveFavorite', {
          route: confirming
            ? `${splitStopLabel(confirming.origin).title} → ${splitStopLabel(confirming.destination).title}`
            : '',
        })}
        confirmLabel={t('removeFavorites')}
        cancelLabel={t('cancel')}
        destructive
        onConfirm={() => {
          if (confirming) {
            toggleFavoriteRoute(confirming.origin, confirming.destination);
          }
          setConfirming(null);
        }}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}

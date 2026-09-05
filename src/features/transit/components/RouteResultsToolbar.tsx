import { useTranslation } from 'react-i18next';
import { ChevronDown, Eye, Star } from 'lucide-react';

import { Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { splitStopLabel } from '@/lib/format';
import { useProfileStore } from '@/lib/store';

/**
 * The two things a rider does with a result list: look at their saved routes, or
 * save the one they just searched.
 *
 * Two equal-width halves rather than `justify-between`, because both Portuguese
 * labels are long and free widths let one crowd the other off the bar.
 */
export function RouteResultsToolbar({
  origin,
  destination,
  expanded,
  onToggleExpanded,
}: {
  origin: string;
  destination: string;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const { t } = useTranslation();
  const favoriteRoutes = useProfileStore((s) => s.favoriteRoutes);
  const toggleFavoriteRoute = useProfileStore((s) => s.toggleFavoriteRoute);

  // Nothing to add and nothing meaningful to show against a blank form.
  if (!origin || !destination) {
    return null;
  }

  const isFavorite = favoriteRoutes.some(
    (r) => r.origin === origin && r.destination === destination,
  );

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-content hover:bg-surface-variant"
      >
        <Eye size={15} className="text-muted" />
        <span className="truncate">{t('showFavorites')}</span>
        {favoriteRoutes.length > 0 ? (
          <span className="rounded-full bg-surface-variant px-1.5 text-xs font-bold text-muted">
            {favoriteRoutes.length}
          </span>
        ) : null}
        <ChevronDown size={15} className={cn('transition', expanded && 'rotate-180')} />
      </button>
      <span aria-hidden className="w-px bg-border" />
      <button
        type="button"
        onClick={() => toggleFavoriteRoute(origin, destination)}
        aria-pressed={isFavorite}
        className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-content hover:bg-surface-variant"
      >
        <Star size={15} className={cn(isFavorite ? 'fill-accent text-accent' : 'text-muted')} />
        {/* The label is part of the target — it is the only thing that says
            which direction the tap goes. */}
        <span className="truncate">{isFavorite ? t('removeFavorites') : t('addFavorites')}</span>
      </button>
    </div>
  );
}

/**
 * The saved routes themselves: ONE card, one row per favourite.
 *
 * A card each meant three lines for one line of information, which matters
 * because this panel opens BELOW the results.
 */
export function FavoritesPanel({
  onSelect,
}: {
  onSelect: (origin: string, destination: string) => void;
}) {
  const { t } = useTranslation();
  const favoriteRoutes = useProfileStore((s) => s.favoriteRoutes);

  if (favoriteRoutes.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted">{t('noFavoriteSearches')}</p>
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-border">
      {favoriteRoutes.map((route, index) => (
        <button
          key={`${route.origin}-${route.destination}-${index}`}
          type="button"
          onClick={() => onSelect(route.origin, route.destination)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-content hover:bg-surface-variant"
        >
          <Star size={14} className="shrink-0 fill-accent text-accent" />
          <span className="min-w-0 flex-1 truncate">
            {splitStopLabel(route.origin).title} → {splitStopLabel(route.destination).title}
          </span>
        </button>
      ))}
    </Card>
  );
}

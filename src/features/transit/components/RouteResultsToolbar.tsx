import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';

import { cn } from '@/lib/cn';
import { useProfileStore } from '@/lib/store';

/**
 * Saving the search the rider just ran.
 *
 * Reading the saved list is NOT here — that lives in the planner's
 * `FavoriteSearchesButton`, because a rider needs their favourites before they
 * have a search, not after.
 */
export function RouteResultsToolbar({
  origin,
  destination,
}: {
  origin: string;
  destination: string;
}) {
  const { t } = useTranslation();
  const favoriteRoutes = useProfileStore((s) => s.favoriteRoutes);
  const toggleFavoriteRoute = useProfileStore((s) => s.toggleFavoriteRoute);

  // Nothing to save against a blank form.
  if (!origin || !destination) {
    return null;
  }

  const isFavorite = favoriteRoutes.some(
    (r) => r.origin === origin && r.destination === destination,
  );

  return (
    <button
      type="button"
      onClick={() => toggleFavoriteRoute(origin, destination)}
      aria-pressed={isFavorite}
      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-content hover:bg-surface-variant"
    >
      <Star size={15} className={cn(isFavorite ? 'fill-accent text-accent' : 'text-muted')} />
      {/* The label is part of the target — it is the only thing that says
          which direction the tap goes. */}
      <span className="truncate">{isFavorite ? t('removeFavorites') : t('addFavorites')}</span>
    </button>
  );
}

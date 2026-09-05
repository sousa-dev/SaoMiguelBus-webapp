export type MarketplaceSortKey = 'random' | 'distance' | 'name' | 'rating' | 'newest';

export interface MarketplaceListFilters {
  category?: string;
  sort: MarketplaceSortKey;
  minRating?: number;
  hasRate?: boolean;
  verified?: boolean;
}

export const DEFAULT_MARKETPLACE_FILTERS: MarketplaceListFilters = {
  sort: 'random',
};

export const MARKETPLACE_SORTS: MarketplaceSortKey[] = [
  'random',
  'name',
  'rating',
  'newest',
];

export const MARKETPLACE_REVIEWED_SHARE_WARNING_THRESHOLD = 0.5;

export function shouldShowMarketplaceRatingWarning(
  filters: MarketplaceListFilters,
  reviewedShare: number | undefined,
): boolean {
  if (reviewedShare == null || reviewedShare >= MARKETPLACE_REVIEWED_SHARE_WARNING_THRESHOLD) {
    return false;
  }
  return filters.sort === 'rating' || (filters.minRating != null && filters.minRating > 0);
}

export function countActiveMarketplaceFilters(filters: MarketplaceListFilters): number {
  let count = 0;
  if (filters.category) count += 1;
  if (filters.minRating != null && filters.minRating > 0) count += 1;
  if (filters.hasRate) count += 1;
  if (filters.verified) count += 1;
  return count;
}

export function hasActiveMarketplaceFilters(filters: MarketplaceListFilters): boolean {
  return countActiveMarketplaceFilters(filters) > 0;
}

export function marketplaceCtaInterval(total: number): number {
  if (total <= 0) return 4;
  return Math.min(10, Math.max(4, Math.floor(total / 3)));
}

export type MarketplaceGridItem =
  | { type: 'provider'; provider: import('@/lib/types').MarketplaceProvider }
  | { type: 'cta'; id: string };

export function buildMarketplaceGridItems(
  providers: import('@/lib/types').MarketplaceProvider[],
): MarketplaceGridItem[] {
  const interval = marketplaceCtaInterval(providers.length);
  const items: MarketplaceGridItem[] = [];
  providers.forEach((provider, index) => {
    if (index > 0 && (index + 1) % interval === 0) {
      items.push({ type: 'cta', id: `cta-${index}` });
    }
    items.push({ type: 'provider', provider });
  });
  return items;
}

export function sortLabelKey(sort: MarketplaceSortKey): string {
  switch (sort) {
    case 'random':
      return 'marketplaceSortRandom';
    case 'distance':
      return 'marketplaceSortNearest';
    case 'name':
      return 'marketplaceSortName';
    case 'rating':
      return 'marketplaceSortRating';
    case 'newest':
      return 'marketplaceSortNewest';
    default: {
      const _exhaustive: never = sort;
      return _exhaustive;
    }
  }
}

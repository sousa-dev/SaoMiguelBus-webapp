import { SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Chip, SearchField } from '@/components/ui';
import {
  countActiveMarketplaceFilters,
  hasActiveMarketplaceFilters,
  MARKETPLACE_SORTS,
  shouldShowMarketplaceRatingWarning,
  sortLabelKey,
  type MarketplaceListFilters,
  type MarketplaceSortKey,
} from '@/features/marketplace/filterHelpers';
import { normalizeSearchText } from '@/lib/format';
import type { ServiceCategory } from '@/lib/types';

const MIN_RATING_OPTIONS = [0, 3, 4, 4.5] as const;

export function MarketplaceToolbar({
  categories,
  filters,
  onChangeFilters,
  onClearFilters,
  query,
  onChangeQuery,
  reviewedShare,
}: {
  categories: ServiceCategory[];
  filters: MarketplaceListFilters;
  onChangeFilters: (next: MarketplaceListFilters) => void;
  onClearFilters: () => void;
  query: string;
  onChangeQuery: (value: string) => void;
  reviewedShare?: number;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');

  const activeCount = countActiveMarketplaceFilters(filters);
  const hasActive = hasActiveMarketplaceFilters(filters);
  const showRatingWarning = shouldShowMarketplaceRatingWarning(filters, reviewedShare);

  const filteredCategories = useMemo(() => {
    const q = normalizeSearchText(categoryQuery);
    if (!q) return categories;
    return categories.filter(
      (cat) => normalizeSearchText(cat.name).includes(q) || normalizeSearchText(cat.slug).includes(q),
    );
  }, [categories, categoryQuery]);

  const setSort = (sort: MarketplaceSortKey) => {
    onChangeFilters({ ...filters, sort });
  };

  return (
    <div className="mb-5 flex flex-col gap-3">
      <SearchField
        placeholder={t('marketplaceSearchPlaceholder', { defaultValue: 'Search services…' })}
        value={query}
        onChange={(e) => onChangeQuery(e.target.value)}
        className="max-w-md"
      />

      <div className="flex flex-wrap gap-2">
        {MARKETPLACE_SORTS.map((sort) => (
          <Chip
            key={sort}
            label={t(sortLabelKey(sort), { defaultValue: sort })}
            active={filters.sort === sort}
            onClick={() => setSort(sort)}
          />
        ))}
      </div>

      {showRatingWarning ? (
        <p className="rounded-xl border border-warning/30 bg-warning-surface px-4 py-3 text-sm text-warning">
          {t('marketplaceMinRatingWarning', {
            defaultValue:
              'Most services still have no reviews — this filter can hide many results.',
          })}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {hasActive ? (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            {t('marketplaceClearFilters', { defaultValue: 'Clear filters' })}
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
          <SlidersHorizontal size={16} />
          {t('marketplaceFiltersTitle', { defaultValue: 'Filters' })}
          {activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>
      </div>

      {open ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('marketplaceFilterCategory', { defaultValue: 'Category' })}
          </p>
          <SearchField
            placeholder={t('marketplaceFilterCategorySearch', { defaultValue: 'Search categories…' })}
            value={categoryQuery}
            onChange={(e) => setCategoryQuery(e.target.value)}
            className="mb-4 max-w-md"
          />
          <div className="mb-6 flex flex-wrap gap-2">
            <Chip
              label={t('marketplaceAllCategories', { defaultValue: 'All' })}
              active={!filters.category}
              onClick={() => onChangeFilters({ ...filters, category: undefined })}
            />
            {filteredCategories.map((cat) => (
              <Chip
                key={cat.slug}
                label={cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                active={filters.category === cat.slug}
                onClick={() =>
                  onChangeFilters({
                    ...filters,
                    category: filters.category === cat.slug ? undefined : cat.slug,
                  })
                }
              />
            ))}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('marketplaceMinRating', { defaultValue: 'Minimum rating' })}
          </p>
          {showRatingWarning ? (
            <p className="mb-3 rounded-xl border border-warning/30 bg-warning-surface px-4 py-3 text-sm text-warning">
              {t('marketplaceMinRatingWarning', {
                defaultValue:
                  'Most services still have no reviews — this filter can hide many results.',
              })}
            </p>
          ) : null}
          <div className="mb-6 flex flex-wrap gap-2">
            {MIN_RATING_OPTIONS.map((value) => (
              <Chip
                key={value}
                label={value === 0 ? t('marketplaceFilterAll', { defaultValue: 'All' }) : `${value}+ ★`}
                active={(filters.minRating ?? 0) === value}
                onClick={() =>
                  onChangeFilters({ ...filters, minRating: value === 0 ? undefined : value })
                }
              />
            ))}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('marketplaceFilterMore', { defaultValue: 'More filters' })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip
              label={t('marketplaceHasRate', { defaultValue: 'Has hourly rate' })}
              active={Boolean(filters.hasRate)}
              onClick={() => onChangeFilters({ ...filters, hasRate: !filters.hasRate || undefined })}
            />
            <Chip
              label={t('marketplaceVerifiedOnly', { defaultValue: 'Verified only' })}
              active={Boolean(filters.verified)}
              onClick={() => onChangeFilters({ ...filters, verified: !filters.verified || undefined })}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {t('marketplaceFilterApply', { defaultValue: 'Apply' })}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { DEFAULT_MARKETPLACE_FILTERS } from '@/features/marketplace/filterHelpers';

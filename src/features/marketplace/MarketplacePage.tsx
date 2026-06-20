import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Store } from 'lucide-react';

import { Button, CenteredSpinner, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import {
  buildMarketplaceGridItems,
  DEFAULT_MARKETPLACE_FILTERS,
  type MarketplaceListFilters,
} from '@/features/marketplace/filterHelpers';
import { MarketplaceRegisterCta } from '@/features/marketplace/MarketplaceRegisterCta';
import { MarketplaceToolbar } from '@/features/marketplace/MarketplaceToolbar';
import { ProviderCard } from '@/features/marketplace/ProviderCard';
import { MARKETPLACE_REGISTER_URL, shareMarketplaceListingInvite } from '@/features/marketplace/share-listing-invite';
import { useDebounced } from '@/hooks/useDebounced';
import { fetchMarketplaceCategories, fetchProviders } from '@/lib/api';
import { track } from '@/lib/analytics';

export function MarketplacePage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<MarketplaceListFilters>(DEFAULT_MARKETPLACE_FILTERS);
  const debouncedQ = useDebounced(query, 350);

  const categories = useQuery({ queryKey: ['marketplace', 'categories'], queryFn: fetchMarketplaceCategories });
  const providers = useQuery({
    queryKey: ['marketplace', 'providers', filters, debouncedQ],
    queryFn: async () => {
      const result = await fetchProviders({
        category: filters.category,
        q: debouncedQ || undefined,
        sort: filters.sort,
        min_rating: filters.minRating,
        has_rate: filters.hasRate || undefined,
        verified: filters.verified || undefined,
        limit: 50,
      });
      if (debouncedQ) {
        track('marketplace', 'search', {
          query: debouncedQ,
          category: filters.category ?? null,
          sort: filters.sort,
          results_count: result.providers.length,
        });
      }
      return result;
    },
  });

  useEffect(() => {
    track('marketplace', 'view', { screen: 'list' });
  }, []);

  const gridItems = useMemo(
    () => buildMarketplaceGridItems(providers.data?.providers ?? []),
    [providers.data],
  );

  const onShareAdd = () =>
    void shareMarketplaceListingInvite(
      t('fabShareMarketplaceInviteMessage', {
        url: MARKETPLACE_REGISTER_URL,
        defaultValue: `Register a local business: ${MARKETPLACE_REGISTER_URL}`,
      }),
      t('marketplaceAddListing', { defaultValue: 'Add service' }),
    );

  return (
    <>
      <Seo modulePath="/marketplace" />
      <PageHeader
        title={t('navBarMarketplaceLabel')}
        subtitle={t('marketplaceSubtitle', { defaultValue: 'Find trusted local service providers.' })}
        actions={
          <Button onClick={onShareAdd} icon={Plus}>
            {t('marketplaceAddListing', { defaultValue: 'Add service' })}
          </Button>
        }
      />

      <MarketplaceRegisterCta variant="compact" />

      <MarketplaceToolbar
        categories={categories.data ?? []}
        filters={filters}
        onChangeFilters={setFilters}
        onClearFilters={() => setFilters(DEFAULT_MARKETPLACE_FILTERS)}
        query={query}
        onChangeQuery={setQuery}
        reviewedShare={providers.data?.meta.reviewedShare}
      />

      {providers.isLoading ? (
        <CenteredSpinner />
      ) : providers.isError ? (
        <EmptyState
          icon={Store}
          title={t('marketplaceLoadError', { defaultValue: 'Could not load services.' })}
          actionLabel={t('searchButton', { defaultValue: 'Retry' })}
          onAction={() => void providers.refetch()}
        />
      ) : gridItems.length === 0 ? (
        <EmptyState
          icon={Store}
          title={t('marketplaceEmpty', { defaultValue: 'No providers found' })}
          actionLabel={t('marketplaceRegisterCtaShare', { defaultValue: 'Share registration link' })}
          onAction={onShareAdd}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {gridItems.map((item) =>
            item.type === 'cta' ? (
              <MarketplaceRegisterCta key={item.id} variant="compact" />
            ) : (
              <ProviderCard key={item.provider.id} provider={item.provider} />
            ),
          )}
          <MarketplaceRegisterCta />
        </div>
      )}
    </>
  );
}

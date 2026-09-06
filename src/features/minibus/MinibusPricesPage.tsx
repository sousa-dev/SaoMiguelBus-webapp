import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { CenteredSpinner, EmptyState } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { MinibusTariffTable } from './components/MinibusTariffTable';
import { useMinibusTariffs } from './hooks';
import { track } from '@/lib/analytics';

/** `/minibus/prices` — the Mini Bus tariff table as its own deep-linkable, SEO'd page. */
export function MinibusPricesPage() {
  const { t } = useTranslation();
  const tariffsQuery = useMinibusTariffs();

  useEffect(() => {
    if (tariffsQuery.data) {
      track('minibus', 'view', { screen: 'prices' });
    }
  }, [tariffsQuery.data]);

  const loading = tariffsQuery.isLoading && !tariffsQuery.data;
  const error = tariffsQuery.isError && !tariffsQuery.data;

  return (
    <>
      <Seo modulePath="/minibus/prices" />
      <BackLink to="/minibus" label={t('navBarMinibusLabel')} />
      <PageHeader title={t('minibusTariffs')} />

      {loading ? <CenteredSpinner /> : null}
      {error ? <EmptyState title={t('minibusLoadError')} /> : null}

      {!loading && !error && tariffsQuery.data ? (
        <div className="max-w-lg">
          <MinibusTariffTable
            tariffs={tariffsQuery.data.tariffs}
            effectiveDate={tariffsQuery.data.tariffs_effective_date}
          />
        </div>
      ) : null}
    </>
  );
}

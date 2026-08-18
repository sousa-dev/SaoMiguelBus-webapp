import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { CenteredSpinner, EmptyState } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { track } from '@/lib/analytics';

import { MinibusAttributionFooter } from './components/MinibusAttributionFooter';
import { MinibusDocumentImage } from './components/MinibusDocumentImage';
import { useMinibusSchematic } from './hooks';

export function MinibusSchematicPage() {
  const { t } = useTranslation();
  const schematicQuery = useMinibusSchematic();

  useEffect(() => {
    track('minibus', 'view', { screen: 'schematic' });
  }, []);

  return (
    <>
      <Seo modulePath="/minibus/schematic" />
      <BackLink to="/minibus" label={t('navBarMinibusLabel')} />
      <PageHeader title={t('minibusSchematic')} />

      {schematicQuery.isLoading ? <CenteredSpinner /> : null}
      {schematicQuery.isError ? <EmptyState title={t('minibusLoadError')} /> : null}

      {schematicQuery.data ? (
        <div className="max-w-4xl">
          <MinibusDocumentImage
            documentSlug="schematic"
            alt={t('minibusSchematic')}
            tapHint={t('minibusNetworkMapTapToZoom')}
            fullscreenLabel={t('minibusNetworkMapOpenFullscreen')}
            closeLabel={t('close')}
          />
          <MinibusAttributionFooter
            sourceUrl={schematicQuery.data.source_url}
            importedAt={schematicQuery.data.imported_at}
          />
        </div>
      ) : null}
    </>
  );
}

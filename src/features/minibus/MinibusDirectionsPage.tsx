import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Route } from 'lucide-react';

import { EmptyState } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { MinibusDirectionsSteps } from '@/features/minibus/components/MinibusDirectionsSteps';
import { MinibusJourneyMap } from '@/features/minibus/components/MinibusJourneyMap';
import { consumePendingDirections } from '@/features/minibus/lib/directions-store';
import { track } from '@/lib/analytics';
import type { MinibusJourney } from '@/lib/types';

/** `/minibus/directions` — reads the journey handed off by the search results, once. */
export function MinibusDirectionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [journey] = useState<MinibusJourney | null>(() => consumePendingDirections());
  const [highlightedStepKey, setHighlightedStepKey] = useState<string | null>(null);

  useEffect(() => {
    if (journey) {
      track('minibus', 'view', { screen: 'directions' });
    }
  }, [journey]);

  if (!journey) {
    return (
      <>
        <Seo modulePath="/minibus/search" />
        <BackLink to="/minibus/search" label={t('minibusSearchTitle')} />
        <PageHeader title={t('minibusViewDirections')} />
        <EmptyState
          icon={Route}
          title={t('minibusNoJourneys')}
          actionLabel={t('minibusSearchTitle')}
          onAction={() => navigate('/minibus/search')}
        />
      </>
    );
  }

  return (
    <>
      <Seo modulePath="/minibus/search" />
      <BackLink to="/minibus/search" label={t('minibusSearchTitle')} />
      <PageHeader title={t('minibusViewDirections')} />

      <div className="flex max-w-xl flex-col gap-4">
        <MinibusJourneyMap journey={journey} highlightedStepKey={highlightedStepKey} />
        <MinibusDirectionsSteps
          journey={journey}
          highlightedStepKey={highlightedStepKey}
          onStepPress={setHighlightedStepKey}
        />
      </div>
    </>
  );
}

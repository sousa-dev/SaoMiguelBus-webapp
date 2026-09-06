import { useTranslation } from 'react-i18next';

import { CenteredSpinner, EmptyState } from '@/components/ui';
import type { MinibusJourney, MinibusLine } from '@/lib/types';

import { MinibusJourneyCard } from './MinibusJourneyCard';

/** Loading / empty / results states for a Mini Bus route search — shared by the hub and `/minibus/search`. */
export function MinibusJourneyResultsList({
  journeys,
  linesByCode,
  isFetching,
  showEmpty,
  onViewDirections,
}: {
  journeys: MinibusJourney[];
  linesByCode: Map<string, MinibusLine>;
  isFetching: boolean;
  showEmpty: boolean;
  onViewDirections: (journey: MinibusJourney) => void;
}) {
  const { t } = useTranslation();

  if (isFetching) return <CenteredSpinner />;
  if (showEmpty) return <EmptyState title={t('minibusNoJourneys')} description={t('minibusNoJourneysHint')} />;
  if (journeys.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {journeys.map((journey, index) => (
        <MinibusJourneyCard
          key={`${journey.legs.map((leg) => leg.board.key).join('-')}-${index}`}
          journey={journey}
          linesByCode={linesByCode}
          onViewDirections={() => onViewDirections(journey)}
        />
      ))}
    </div>
  );
}

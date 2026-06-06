import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Bus, Footprints, MapPin, Navigation, Search } from 'lucide-react';

import { Badge, Button, Card, CenteredSpinner, EmptyState } from '@/components/ui';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { useBootstrap } from '@/hooks/useBootstrap';
import { resolveDayType } from '@/lib/format';
import { StopPicker } from '@/features/transit/components';
import { useDirections, useStops } from '@/features/transit/hooks';
import type { DirectionsLeg, DirectionsStep } from '@/lib/types';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function StepRow({ step }: { step: DirectionsStep }) {
  const isTransit = step.travel_mode === 'TRANSIT';
  const td = step.transit_details;
  return (
    <li className="flex gap-3 py-2">
      <div className="mt-0.5 text-muted">
        {isTransit ? <Bus size={18} className="text-primary" /> : <Footprints size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        {isTransit && td ? (
          <div className="flex flex-wrap items-center gap-2">
            {td.line?.short_name || td.line?.name ? (
              <Badge tone="primary">{td.line?.short_name ?? td.line?.name}</Badge>
            ) : null}
            <span className="text-sm font-medium text-content">
              {td.departure_stop?.name} → {td.arrival_stop?.name}
            </span>
          </div>
        ) : (
          <p className="text-sm text-content">{stripHtml(step.html_instructions ?? '')}</p>
        )}
        <p className="text-xs text-muted">
          {step.distance?.text} {step.duration?.text ? `· ${step.duration.text}` : ''}
          {isTransit && td?.departure_time?.text
            ? ` · ${td.departure_time.text} – ${td.arrival_time?.text ?? ''}`
            : ''}
        </p>
      </div>
    </li>
  );
}

function LegCard({ leg, index }: { leg: DirectionsLeg; index: number }) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-variant px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-content">
          <Navigation size={16} className="text-primary" />
          {t('directionsOptionLabel', { count: index + 1, defaultValue: `Option ${index + 1}` })}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          {leg.departure_time?.text && leg.arrival_time?.text ? (
            <span className="font-semibold text-content">
              {leg.departure_time.text} – {leg.arrival_time.text}
            </span>
          ) : null}
          {leg.duration?.text ? <Badge tone="neutral">{leg.duration.text}</Badge> : null}
        </div>
      </div>
      <div className="px-4 py-2">
        <ol className="divide-y divide-border">
          {(leg.steps ?? []).map((s, i) => (
            <StepRow key={i} step={s} />
          ))}
        </ol>
      </div>
    </Card>
  );
}

export function DirectionsPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { data: bootstrap } = useBootstrap();
  const { data: stops = [] } = useStops();

  const [origin, setOrigin] = useState(params.get('origin') ?? '');
  const [destination, setDestination] = useState(params.get('destination') ?? '');
  const [submitted, setSubmitted] = useState(Boolean(params.get('origin') && params.get('destination')));

  const day = useMemo(() => resolveDayType(new Date(), bootstrap?.holidays), [bootstrap?.holidays]);
  const start = params.get('start') ?? '00h00';

  const directions = useDirections({ origin, destination, day, start, enabled: submitted });

  const routes = directions.data?.routes ?? [];

  return (
    <>
      <BackLink to="/transit" label={t('navBarSearchLabel')} />
      <PageHeader title={t('navBarRoutesLabel', { defaultValue: 'Directions' })} subtitle={t('directionsSubtitle', { defaultValue: 'Step-by-step transit directions powered by Google Maps.' })} />

      <Card className="mb-6 p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <StopPicker value={origin} onChange={setOrigin} stops={stops} placeholder={t('originPlaceholder', { defaultValue: 'Origin' })} />
          <StopPicker value={destination} onChange={setDestination} stops={stops} placeholder={t('destinationPlaceholder', { defaultValue: 'Destination' })} />
          <Button icon={Search} onClick={() => setSubmitted(true)} disabled={!origin || !destination}>
            {t('searchButton', { defaultValue: 'Search' })}
          </Button>
        </div>
      </Card>

      {directions.isFetching ? <CenteredSpinner /> : null}

      {submitted && !directions.isFetching && routes.length === 0 ? (
        <EmptyState icon={MapPin} title={t('directionsEmptyTitle', { defaultValue: 'No directions found' })} description={t('directionsEmptyBody', { defaultValue: 'Try a different origin, destination or time.' })} />
      ) : null}

      <div className="flex flex-col gap-4">
        {routes.map((route, ri) =>
          (route.legs ?? []).map((leg, li) => <LegCard key={`${ri}-${li}`} leg={leg} index={ri} />),
        )}
      </div>
    </>
  );
}

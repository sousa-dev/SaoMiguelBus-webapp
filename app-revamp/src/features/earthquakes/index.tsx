import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Activity, MapPin, Waves } from 'lucide-react';

import { Badge, Card, CenteredSpinner, Chip, EmptyState, SegmentedControl } from '@/components/ui';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { MapView, type MapPoint } from '@/components/MapView';
import { fetchSeismicEvent, fetchSeismicEvents } from '@/lib/api';
import { formatAppDateTime, formatRelativeTime } from '@/lib/format';
import { magnitudeColorVar, seismicEventHeadline, seismicMagnitudeLabelKey } from '@/lib/seismic';
import type { SeismicEvent } from '@/lib/types';

const WINDOWS = [
  { value: 24, key: 'seismicWindow24h', fallback: '24h' },
  { value: 72, key: 'seismicWindow3d', fallback: '3d' },
  { value: 168, key: 'seismicWindow7d', fallback: '7d' },
  { value: 720, key: 'seismicWindow30d', fallback: '30d' },
];

function magnitudeHex(m: number): string {
  if (m >= 5) return '#b91c1c';
  if (m >= 3) return '#b45309';
  return '#15803d';
}

function MagCircle({ magnitude, size = 48 }: { magnitude: number; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ width: size, height: size, backgroundColor: magnitudeColorVar(magnitude), fontSize: size / 2.8 }}
    >
      {magnitude.toFixed(1)}
    </span>
  );
}

function EarthquakeCard({ event }: { event: SeismicEvent }) {
  const { t, i18n } = useTranslation();
  const headline = seismicEventHeadline(event, t) ?? (event.region || 'Açores');
  return (
    <Link to={`/earthquakes/${event.id}`}>
      <Card className="flex items-center gap-4 p-4 transition hover:border-outline">
        <MagCircle magnitude={event.magnitude} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-content">{headline}</p>
          <p className="text-xs text-muted">{t(seismicMagnitudeLabelKey(event.magnitude))}</p>
          <p className="text-xs text-muted">{formatRelativeTime(event.occurredAt, i18n.language)}</p>
        </div>
        {event.depthKm != null ? <Badge tone="neutral">{Math.round(event.depthKm)} km</Badge> : null}
      </Card>
    </Link>
  );
}

export function EarthquakesPage() {
  const { t } = useTranslation();
  const [windowHours, setWindowHours] = useState(24);
  const [view, setView] = useState<'map' | 'list'>('list');

  const events = useQuery({
    queryKey: ['seismic', 'events', windowHours],
    queryFn: () => fetchSeismicEvents({ sinceHours: windowHours, limit: 50 }),
  });

  const points: MapPoint[] = (events.data ?? []).map((e) => ({
    id: e.id,
    lat: e.latitude,
    lng: e.longitude,
    color: magnitudeHex(e.magnitude),
    radius: 6 + e.magnitude * 2,
    popup: (
      <div className="text-sm">
        <strong>M{e.magnitude.toFixed(1)}</strong> · {e.region}
        <br />
        {formatAppDateTime(e.occurredAt)}
      </div>
    ),
  }));

  return (
    <>
      <PageHeader
        title={t('navBarEarthquakesLabel')}
        actions={
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: t('seismicListTab') },
              { value: 'map', label: t('seismicMapTab') },
            ]}
          />
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {WINDOWS.map((w) => (
          <Chip
            key={w.value}
            label={t(w.key, { defaultValue: w.fallback })}
            active={windowHours === w.value}
            onClick={() => setWindowHours(w.value)}
          />
        ))}
      </div>

      {events.isLoading ? (
        <CenteredSpinner />
      ) : (events.data ?? []).length === 0 ? (
        <EmptyState icon={Waves} title={t('seismicEmpty')} description={t('seismicMapEmptyHint', { defaultValue: undefined })} />
      ) : view === 'map' ? (
        <Card className="h-[600px] overflow-hidden">
          <MapView points={points} zoom={8} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {events.data!.map((e) => (
            <EarthquakeCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </>
  );
}

export function EarthquakeDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const eventId = Number(id);
  const event = useQuery({
    queryKey: ['seismic', 'event', eventId],
    queryFn: () => fetchSeismicEvent(eventId),
    enabled: Number.isFinite(eventId),
  });

  if (event.isLoading) return <CenteredSpinner />;
  if (!event.data) {
    return (
      <>
        <BackLink to="/earthquakes" label={t('navBarEarthquakesLabel')} />
        <EmptyState icon={Waves} title={t('seismicNotFound')} />
      </>
    );
  }

  const e = event.data;
  const headline = seismicEventHeadline(e, t) ?? (e.region || 'Azores');

  return (
    <>
      <BackLink to="/earthquakes" label={t('navBarEarthquakesLabel')} />
      <PageHeader title={t('seismicDetailTitle', { defaultValue: 'Earthquake' })} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-4">
            <MagCircle magnitude={e.magnitude} size={72} />
            <div>
              <p className="text-lg font-bold text-content">{headline}</p>
              <p className="text-sm text-muted">{t(seismicMagnitudeLabelKey(e.magnitude))}</p>
              <p className="text-sm text-muted">{formatRelativeTime(e.occurredAt, i18n.language)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-surface-variant p-3">
              <p className="text-xs text-muted">{t('seismicDepth', { defaultValue: 'Depth' })}</p>
              <p className="font-bold text-content">{e.depthKm != null ? `${e.depthKm} km` : '—'}</p>
            </div>
            <div className="rounded-xl bg-surface-variant p-3">
              <p className="text-xs text-muted">{t('seismicCoords', { defaultValue: 'Coordinates' })}</p>
              <p className="font-bold text-content">
                {e.latitude.toFixed(3)}, {e.longitude.toFixed(3)}
              </p>
            </div>
          </div>
          {e.feltCount != null ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Activity size={16} /> {t('seismicFeltCount', { count: e.feltCount, defaultValue: `${e.feltCount} reports` })}
            </div>
          ) : null}
          <p className="text-xs text-muted">{formatAppDateTime(e.occurredAt)}</p>
        </Card>

        <Card className="h-[400px] overflow-hidden">
          <MapView
            points={[{ id: e.id, lat: e.latitude, lng: e.longitude, color: magnitudeHex(e.magnitude), radius: 12 }]}
            center={{ lat: e.latitude, lng: e.longitude }}
            zoom={9}
            fit={false}
          />
        </Card>
      </div>
      <p className="mt-4 inline-flex items-center gap-1 text-xs text-muted">
        <MapPin size={12} /> EMSC-CSEM
      </p>
    </>
  );
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Download, Mountain, Navigation, Route as RouteIcon } from 'lucide-react';

import { Badge, Button, Card, CenteredSpinner, Chip, EmptyState, SearchField } from '@/components/ui';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { MapView, type MapPoint } from '@/components/MapView';
import { fetchTrail, fetchTrails } from '@/lib/api';
import { normalizeSearchText } from '@/lib/format';
import type { TrailSummary } from '@/lib/types';

const DIFFICULTIES = [
  { value: '', key: 'allLabel', fallback: 'All' },
  { value: 'easy', key: 'trailDifficultyEasy', fallback: 'Easy' },
  { value: 'moderate', key: 'trailDifficultyModerate', fallback: 'Moderate' },
  { value: 'hard', key: 'trailDifficultyHard', fallback: 'Hard' },
];

const SHAPES = [
  { value: '', key: 'allLabel', fallback: 'All' },
  { value: 'circular', key: 'trailShapeCircular', fallback: 'Circular' },
  { value: 'linear', key: 'trailShapeLinear', fallback: 'Linear' },
];

const DISTANCE_RANGES = [
  { key: 'all', label: 'All', minLength: undefined, maxLength: undefined },
  { key: 'short', label: '< 5 km', minLength: undefined, maxLength: 5 },
  { key: 'mid', label: '5–10 km', minLength: 5, maxLength: 10 },
  { key: 'long', label: '> 10 km', minLength: 10, maxLength: undefined },
];

function difficultyTone(difficulty: string): 'success' | 'warning' | 'danger' | 'neutral' {
  const d = difficulty.toLowerCase();
  if (d.includes('eas') || d.includes('fácil') || d.includes('facil')) return 'success';
  if (d.includes('mod')) return 'warning';
  if (d.includes('hard') || d.includes('dif')) return 'danger';
  return 'neutral';
}

function TrailCard({ trail }: { trail: TrailSummary }) {
  const { t } = useTranslation();
  return (
    <Link to={`/trails/${trail.id}`}>
      <Card className="flex h-full flex-col overflow-hidden transition hover:border-outline">
        <div className="aspect-[3/2] w-full overflow-hidden bg-surface-variant">
          {trail.mapImageUrl ? (
            <img src={trail.mapImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted"><Mountain size={32} /></div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-bold leading-snug text-content">{trail.name}</h3>
          <p className="text-xs text-muted">
            {trail.sourceRef ? `${trail.sourceRef} · ` : ''}
            {trail.distanceKm != null ? `${trail.distanceKm} km` : ''}
            {trail.durationMin ? ` · ${Math.round(trail.durationMin / 60)}h` : ''}
          </p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Badge tone={difficultyTone(trail.difficulty)}>{trail.difficulty}</Badge>
            {trail.shape ? <Badge tone="neutral">{t(`trailShape_${trail.shape}`, { defaultValue: trail.shape })}</Badge> : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function TrailsPage() {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState('');
  const [shape, setShape] = useState('');
  const [distance, setDistance] = useState('all');
  const [query, setQuery] = useState('');

  const range = DISTANCE_RANGES.find((r) => r.key === distance);
  const trails = useQuery({
    queryKey: ['trails', difficulty, shape, distance],
    queryFn: () =>
      fetchTrails({
        difficulty: difficulty || undefined,
        shape: shape || undefined,
        minLength: range?.minLength,
        maxLength: range?.maxLength,
        limit: 100,
      }),
  });

  const filtered = useMemo(() => {
    const q = normalizeSearchText(query);
    return (trails.data?.trails ?? []).filter((tr) => !q || normalizeSearchText(tr.name).includes(q));
  }, [trails.data, query]);

  return (
    <>
      <PageHeader title={t('navBarTrailsLabel')} subtitle={trails.data?.attribution} />

      <div className="mb-5 flex flex-col gap-3">
        <SearchField
          placeholder={t('trailsSearchPlaceholder', { defaultValue: 'Search trails…' })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <Chip key={d.value} label={t(d.key, { defaultValue: d.fallback })} active={difficulty === d.value} onClick={() => setDifficulty(d.value)} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {SHAPES.map((s) => (
            <Chip key={s.value} label={t(s.key, { defaultValue: s.fallback })} active={shape === s.value} onClick={() => setShape(s.value)} />
          ))}
          <span className="mx-1 w-px self-stretch bg-border" />
          {DISTANCE_RANGES.map((r) => (
            <Chip key={r.key} label={r.label} active={distance === r.key} onClick={() => setDistance(r.key)} />
          ))}
        </div>
      </div>

      {trails.isLoading ? (
        <CenteredSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Mountain} title={t('trailsEmpty', { defaultValue: 'No trails found' })} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tr) => (
            <TrailCard key={tr.id} trail={tr} />
          ))}
        </div>
      )}
    </>
  );
}

export function TrailDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const trailId = Number(id);
  const trail = useQuery({
    queryKey: ['trail', trailId],
    queryFn: () => fetchTrail(trailId),
    enabled: Number.isFinite(trailId),
  });

  if (trail.isLoading) return <CenteredSpinner />;
  if (!trail.data) {
    return (
      <>
        <BackLink to="/trails" label={t('navBarTrailsLabel')} />
        <EmptyState icon={Mountain} title={t('trailNotFound', { defaultValue: 'Trail not found' })} />
      </>
    );
  }

  const d = trail.data;
  const description = i18n.language.startsWith('pt') ? d.descriptionPt || d.descriptionEn : d.descriptionEn || d.descriptionPt;
  const waypoints: MapPoint[] = (d.waypoints ?? []).map((w, i) => ({ id: i, lat: w.lat, lng: w.lng, popup: w.name }));
  if (d.startLat != null && d.startLng != null) {
    waypoints.unshift({ id: 'start', lat: d.startLat, lng: d.startLng, color: '#b91c1c' });
  }

  return (
    <>
      <BackLink to="/trails" label={t('navBarTrailsLabel')} />
      <PageHeader
        title={d.name}
        subtitle={d.sourceRef}
        actions={
          d.startLat != null && d.startLng != null ? (
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${d.startLat},${d.startLng}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" icon={Navigation}>{t('trailDirections', { defaultValue: 'Directions' })}</Button>
            </a>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={difficultyTone(d.difficulty)}>{d.difficulty}</Badge>
        {d.distanceKm != null ? <Badge tone="neutral"><RouteIcon size={13} /> {d.distanceKm} km</Badge> : null}
        {d.shape ? <Badge tone="neutral">{d.shape}</Badge> : null}
        {d.durationMin ? <Badge tone="neutral">{Math.round(d.durationMin / 60)}h</Badge> : null}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <div>
          {description ? <p className="whitespace-pre-line text-content">{description}</p> : null}
          {d.nearestStop ? (
            <Card className="mt-4 p-4">
              <p className="text-xs font-semibold text-muted">{t('trailNearestStop', { defaultValue: 'Nearest bus stop' })}</p>
              <p className="font-bold text-content">{d.nearestStop.name}</p>
              <p className="text-sm text-muted">{d.nearestStop.distanceKm.toFixed(1)} km</p>
            </Card>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {d.gpxUrl ? (
              <a href={d.gpxUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" icon={Download}>GPX</Button>
              </a>
            ) : null}
            {d.kmlUrl ? (
              <a href={d.kmlUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" icon={Download}>KML</Button>
              </a>
            ) : null}
          </div>
          {d.attribution ? <p className="mt-4 text-xs text-muted">{d.attribution}</p> : null}
        </div>

        {waypoints.length > 0 ? (
          <Card className="h-[420px] overflow-hidden">
            <MapView points={waypoints} zoom={12} />
          </Card>
        ) : d.mapImageUrl ? (
          <img src={d.mapImageUrl} alt="" className="w-full rounded-2xl border border-border object-cover" />
        ) : null}
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowRightLeft, Bus } from 'lucide-react';

import { Button, Card, CenteredSpinner, EmptyState } from '@/components/ui';
import { MapView, type MapLine, type MapPoint } from '@/components/MapView';
import { Seo } from '@/components/Seo';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { AdBanner } from '@/features/ads/components/AdBanner';
import { useLineShape } from '@/features/transit/hooks';
import { track } from '@/lib/analytics';
import { displayRouteNumber, splitStopLabel } from '@/lib/format';
import { decodePolyline } from '@/lib/polyline';

export function LinePage() {
  const { t } = useTranslation();
  const { code } = useParams();
  const line = useLineShape(code ?? null);
  const [directionIndex, setDirectionIndex] = useState(0);

  useEffect(() => {
    if (line.data) {
      track('transit', 'line_view', { line: line.data.code });
    }
  }, [line.data]);

  if (line.isLoading) return <CenteredSpinner />;
  if (line.isError || !line.data) {
    return (
      <>
        <BackLink to="/transit" label={t('navBarSearchLabel')} />
        <EmptyState icon={Bus} title={t('transitLineNoShape', { line: code ?? '' })} />
      </>
    );
  }

  const data = line.data;
  const directions = data.directions;
  const direction = directions[directionIndex % Math.max(directions.length, 1)];

  // '' means the server could not draw the road honestly — no stored shape, or a
  // shape that does not match the stops. Never substitute a straight line: on
  // this island it would cut 12.9 km through the caldera.
  const points = decodePolyline(direction?.shape ?? '');
  const lines: MapLine[] =
    points.length > 1 ? [{ id: 'line', coords: points, color: '#1e88e5', weight: 5 }] : [];

  const pins: MapPoint[] = (direction?.stops ?? [])
    .filter((stop) => typeof stop.lat === 'number' && typeof stop.lon === 'number')
    .map((stop) => ({
      id: `${stop.stopId}-${stop.sequence}`,
      lat: stop.lat as number,
      lng: stop.lon as number,
      radius: 5,
      popup: (
        <span className="text-xs">
          <strong>{stop.name}</strong>
          {stop.code ? ` · ${stop.code}` : ''}
        </span>
      ),
    }));

  return (
    <>
      <Seo title={`${t('routeLabel', { defaultValue: 'Route' })} ${displayRouteNumber(data.code)}`} />
      <BackLink to="/transit" label={t('navBarSearchLabel')} />
      <PageHeader
        title={`${t('routeLabel', { defaultValue: 'Route' })} ${displayRouteNumber(data.code)}`}
        subtitle={data.displayName}
        actions={
          directions.length > 1 ? (
            <Button
              variant="outline"
              size="sm"
              icon={ArrowRightLeft}
              onClick={() => setDirectionIndex((i) => (i + 1) % directions.length)}
            >
              {t('transitLineSwapDirection')}
            </Button>
          ) : null
        }
      />

      <div className="mb-5 empty:hidden">
        <AdBanner on="line" slot="top" content={Boolean(direction)} />
      </div>

      {!direction ? (
        <EmptyState icon={Bus} title={t('transitLineNoShape', { line: data.code })} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div
            className="h-[28rem] overflow-hidden rounded-2xl border border-border"
            aria-label={t('transitLineMapA11y', { line: data.code })}
          >
            {lines.length === 0 && pins.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6">
                <p className="text-sm text-muted">{t('transitLineNoShape', { line: data.code })}</p>
              </div>
            ) : (
              <MapView points={pins} lines={lines} />
            )}
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-bold text-content">
                {t('transitLineStopsCount', { count: direction.stops.length })}
              </h2>
            </div>
            <ol className="max-h-[24rem] divide-y divide-border overflow-auto">
              {direction.stops.map((stop) => {
                const label = splitStopLabel(stop.name);
                return (
                  <li key={`${stop.stopId}-${stop.sequence}`}>
                    <Link
                      to={`/transit/stop/${stop.stopId}`}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-surface-variant"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-content">{label.title}</span>
                        {label.subtitle ? (
                          <span className="block truncate text-xs text-muted">
                            {label.subtitle}
                          </span>
                        ) : null}
                      </span>
                      {stop.code ? (
                        <span className="shrink-0 text-xs font-semibold text-muted">
                          {stop.code}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      )}
    </>
  );
}

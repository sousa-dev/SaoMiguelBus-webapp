import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bus,
  Newspaper,
  TriangleAlert,
  Waves,
} from 'lucide-react';

import { Card } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { MapView, type MapPoint } from '@/components/MapView';
import { resolveEnabledModules } from '@/config/island';
import { useBootstrap } from '@/hooks/useBootstrap';
import { SITE } from '@/lib/seo-config';
import { getSiteUrl } from '@/lib/site';
import {
  fetchNewsArticles,
  fetchSeismicEvents,
  fetchTrafficReports,
  fetchWeatherParishes,
} from '@/lib/api';
import { formatAppDate } from '@/lib/format';
import { AZORES_ARCHIPELAGO_VIEW } from '@/lib/map-bounds';
import { weatherCodeEmoji, weatherCodeLabelKey } from '@/lib/weather-codes';

const DEFAULT_PARISH_SLUG = 'sao-sebastiao-ponta-delgada';

function greetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'hubGreetingMorning';
  if (hour < 19) return 'hubGreetingAfternoon';
  return 'hubGreetingEvening';
}

function magnitudeHex(m: number): string {
  if (m >= 5) return '#b91c1c';
  if (m >= 3) return '#b45309';
  return '#15803d';
}

/** Small, non-interactive OSM preview map used on the hub cards. */
function MiniMap({
  points,
  color,
  center,
  zoom,
  fit = true,
}: {
  points: MapPoint[];
  color: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  fit?: boolean;
}) {
  const colored = points.map((p) => ({ ...p, color: p.color ?? color, radius: p.radius ?? 6 }));
  return (
    <div className="relative isolate z-0 h-28 w-full overflow-hidden rounded-xl border border-border">
      <MapView
        points={colored}
        interactive={false}
        center={center}
        zoom={zoom}
        fit={fit}
      />
    </div>
  );
}

function SectionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
      {label} <ArrowRight size={15} />
    </Link>
  );
}

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { data: bootstrap } = useBootstrap();
  const enabled = resolveEnabledModules(bootstrap?.island?.enabledModules);

  const weather = useQuery({
    queryKey: ['weather', 'parishes'],
    queryFn: fetchWeatherParishes,
    enabled: enabled.includes('weather'),
  });
  const seismic = useQuery({
    queryKey: ['seismic', 'events', 24],
    queryFn: () => fetchSeismicEvents({ sinceHours: 24, limit: 50 }),
    enabled: enabled.includes('seismic'),
  });
  const traffic = useQuery({
    queryKey: ['traffic', 'reports', undefined],
    queryFn: () => fetchTrafficReports({ includeScheduled: true, limit: 100 }),
    enabled: enabled.includes('traffic'),
  });
  const news = useQuery({
    queryKey: ['news', 'articles', 'noticias', undefined, undefined],
    queryFn: () => fetchNewsArticles({ category: 'noticias' }),
    enabled: enabled.includes('news'),
  });

  const parish =
    weather.data?.parishes.find((p) => p.slug === DEFAULT_PARISH_SLUG) ?? weather.data?.parishes[0];
  const topNews = (news.data ?? []).slice(0, 3);
  const seismicCount = seismic.data?.length ?? 0;
  const activeTraffic = (traffic.data ?? []).filter((r) => r.status === 'active');
  const activeTrafficCount = activeTraffic.length;

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: getSiteUrl(),
    inLanguage: i18n.language?.split('-')[0] ?? 'pt',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getSiteUrl()}/transit?origin={origin}&destination={destination}`,
      'query-input': 'required name=origin',
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <Seo home jsonLd={websiteJsonLd} />
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-content">
          {t(greetingKey())} 👋
        </h1>
        <p className="mt-1 text-muted">{t('hubSubtitle')}</p>
      </div>

      <div className="flex flex-col items-start gap-3 rounded-2xl border border-primary/20 bg-primary p-6 text-on-primary shadow-sm shadow-black/[0.03] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Bus size={32} />
          <div>
            <p className="text-lg font-bold">{t('homeBusCtaGeneric')}</p>
            <p className="text-sm text-on-primary/90">{t('bannerSubtitle')}</p>
          </div>
        </div>
        <Link
          to="/transit"
          className="rounded-xl bg-on-primary/15 px-5 py-2.5 font-semibold text-on-primary backdrop-blur hover:bg-on-primary/25"
        >
          {t('searchButton')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {enabled.includes('weather') && parish ? (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-content">{t('homeWeatherTitle')}</h2>
              <SectionLink to="/weather" label={parish.name} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-5xl">{weatherCodeEmoji(parish.current.weatherCode)}</span>
              <div>
                <p className="text-3xl font-extrabold text-content">
                  {parish.current.temperature != null ? `${Math.round(parish.current.temperature)}°` : '—'}
                </p>
                <p className="text-sm text-muted">{t(weatherCodeLabelKey(parish.current.weatherCode))}</p>
              </div>
              <div className="ml-auto flex gap-3">
                {parish.daily.slice(0, 3).map((d) => (
                  <div key={d.date} className="text-center">
                    <p className="text-xs text-muted">{formatAppDate(d.date).slice(0, 5)}</p>
                    <p className="text-xl">{weatherCodeEmoji(d.weatherCode)}</p>
                    <p className="text-xs font-semibold text-content">{d.tempMax != null ? Math.round(d.tempMax) : '—'}°</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {enabled.includes('seismic') ? (
          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Waves size={18} className="text-primary" />
              <h2 className="font-bold text-content">{t('homeEarthquakesTitle')}</h2>
            </div>
            <MiniMap
              color="#b45309"
              center={AZORES_ARCHIPELAGO_VIEW.center}
              zoom={AZORES_ARCHIPELAGO_VIEW.zoom}
              fit={AZORES_ARCHIPELAGO_VIEW.fit}
              points={(seismic.data ?? []).map((e) => ({
                id: e.id,
                lat: e.latitude,
                lng: e.longitude,
                color: magnitudeHex(e.magnitude),
                radius: 5 + e.magnitude,
              }))}
            />
            <p className="mt-2 text-sm text-muted">
              {seismicCount === 0
                ? t('hubSeismicCalm')
                : t('hubSeismicPreviewCount', { count: seismicCount })}
            </p>
            <div className="mt-2"><SectionLink to="/earthquakes" label={t('homeSeeAll', { defaultValue: 'See all' })} /></div>
          </Card>
        ) : null}

        {enabled.includes('traffic') ? (
          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <TriangleAlert size={18} className="text-warning" />
              <h2 className="font-bold text-content">{t('homeTrafficTitle')}</h2>
            </div>
            <MiniMap
              color="#b45309"
              points={activeTraffic.map((r) => ({ id: r.id, lat: r.latitude, lng: r.longitude }))}
            />
            <p className="mt-2 text-sm text-muted">
              {activeTrafficCount === 0
                ? t('homeTrafficCalm')
                : t('hubTrafficPreviewCount', { count: activeTrafficCount })}
            </p>
            <div className="mt-2"><SectionLink to="/traffic" label={t('homeSeeAll', { defaultValue: 'See all' })} /></div>
          </Card>
        ) : null}

        {enabled.includes('news') ? (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold text-content">
                <Newspaper size={18} className="text-primary" /> {t('homeNewsTitle')}
              </h2>
              <SectionLink to="/news" label={t('homeSeeAll', { defaultValue: 'See all' })} />
            </div>
            {topNews.length === 0 ? (
              <p className="text-sm text-muted">{t('homeNewsEmpty')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topNews.map((a) => (
                  <Link key={a.id} to={`/news/${a.id}`} className="block rounded-lg p-1.5 hover:bg-surface-variant">
                    <p className="line-clamp-2 text-sm font-medium text-content">{a.title}</p>
                    <p className="text-xs text-muted">{a.source.name} · {formatAppDate(a.publishedAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        ) : null}
      </div>
    </div>
  );
}

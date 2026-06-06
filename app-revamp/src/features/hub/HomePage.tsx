import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bus,
  Compass,
  Mountain,
  Newspaper,
  TriangleAlert,
  Waves,
} from 'lucide-react';

import { Badge, Card } from '@/components/ui';
import { resolveEnabledModules } from '@/config/island';
import { useBootstrap } from '@/hooks/useBootstrap';
import {
  fetchNewsArticles,
  fetchSeismicEvents,
  fetchTours,
  fetchTrafficReports,
  fetchTrails,
  fetchWeatherParishes,
} from '@/lib/api';
import { formatAppDate } from '@/lib/format';
import { weatherCodeEmoji, weatherCodeLabelKey } from '@/lib/weather-codes';

const DEFAULT_PARISH_SLUG = 'sao-sebastiao-ponta-delgada';

function greetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'hubGreetingMorning';
  if (hour < 19) return 'hubGreetingAfternoon';
  return 'hubGreetingEvening';
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
  const locale = i18n.language?.split('-')[0] ?? 'pt';

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
  const tours = useQuery({
    queryKey: ['tours', locale],
    queryFn: () => fetchTours({ locale, currency: 'EUR', limit: 30 }),
    enabled: enabled.includes('events'),
  });
  const trails = useQuery({
    queryKey: ['trails', '', '', 'all'],
    queryFn: () => fetchTrails({ limit: 100 }),
    enabled: enabled.includes('trails'),
  });

  const parish =
    weather.data?.parishes.find((p) => p.slug === DEFAULT_PARISH_SLUG) ?? weather.data?.parishes[0];
  const topNews = (news.data ?? []).slice(0, 3);
  const featuredTour = tours.data?.[0];
  const featuredTrail = trails.data?.trails?.[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-content">
          {t(greetingKey())} 👋
        </h1>
        <p className="mt-1 text-muted">{t('hubSubtitle', { defaultValue: 'Your São Miguel companion — schedules, weather, news and more.' })}</p>
      </div>

      {/* Bus CTA */}
      <Card className="flex flex-col items-start gap-3 bg-primary p-6 text-on-primary sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Bus size={32} />
          <div>
            <p className="text-lg font-bold">{t('homeBusCtaTitle', { defaultValue: 'Plan your bus trip' })}</p>
            <p className="text-sm opacity-90">{t('homeInstructionsText', { defaultValue: 'Search routes between any two stops.' })}</p>
          </div>
        </div>
        <Link to="/transit" className="rounded-xl bg-white/20 px-5 py-2.5 font-semibold backdrop-blur hover:bg-white/30">
          {t('searchButton', { defaultValue: 'Search' })}
        </Link>
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Weather */}
        {enabled.includes('weather') && parish ? (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-content">{t('navBarWeatherLabel')}</h2>
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

        {/* Earthquakes + Traffic */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:col-span-1 md:grid-cols-1 lg:col-span-1">
          {enabled.includes('seismic') ? (
            <Card className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <Waves size={18} className="text-primary" />
                <h2 className="font-bold text-content">{t('navBarEarthquakesLabel')}</h2>
              </div>
              <p className="text-2xl font-extrabold text-content">{seismic.data?.length ?? 0}</p>
              <p className="text-sm text-muted">{t('homeEarthquakes24h', { defaultValue: 'in the last 24h' })}</p>
              <div className="mt-2"><SectionLink to="/earthquakes" label={t('seeAllLabel', { defaultValue: 'See all' })} /></div>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {enabled.includes('traffic') ? (
          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <TriangleAlert size={18} className="text-warning" />
              <h2 className="font-bold text-content">{t('homeTrafficTitle')}</h2>
            </div>
            <p className="text-2xl font-extrabold text-content">{traffic.data?.length ?? 0}</p>
            <p className="text-sm text-muted">{t('homeTrafficActive', { defaultValue: 'active reports' })}</p>
            <div className="mt-2"><SectionLink to="/traffic" label={t('seeAllLabel', { defaultValue: 'See all' })} /></div>
          </Card>
        ) : null}

        {/* News */}
        {enabled.includes('news') ? (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold text-content"><Newspaper size={18} className="text-primary" /> {t('navBarNewsLabel')}</h2>
              <SectionLink to="/news" label={t('seeAllLabel', { defaultValue: 'See all' })} />
            </div>
            <div className="flex flex-col gap-2">
              {topNews.map((a) => (
                <Link key={a.id} to={`/news/${a.id}`} className="block rounded-lg p-1.5 hover:bg-surface-variant">
                  <p className="line-clamp-2 text-sm font-medium text-content">{a.title}</p>
                  <p className="text-xs text-muted">{a.source.name} · {formatAppDate(a.publishedAt)}</p>
                </Link>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      {/* Prepare section: tours + trails */}
      {(enabled.includes('events') || enabled.includes('trails')) ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {enabled.includes('events') && featuredTour ? (
            <Link to={`/tours/${encodeURIComponent(featuredTour.code)}`}>
              <Card className="group relative h-44 overflow-hidden">
                <img src={featuredTour.thumbnailUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <Badge tone="accent"><Compass size={12} /> {t('navBarToursLabel')}</Badge>
                  <p className="mt-1.5 line-clamp-2 font-bold">{featuredTour.title}</p>
                </div>
              </Card>
            </Link>
          ) : null}
          {enabled.includes('trails') && featuredTrail ? (
            <Link to={`/trails/${featuredTrail.id}`}>
              <Card className="group relative h-44 overflow-hidden">
                {featuredTrail.mapImageUrl ? (
                  <img src={featuredTrail.mapImageUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-surface-variant"><Mountain size={40} className="text-muted" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <Badge tone="success"><Mountain size={12} /> {t('navBarTrailsLabel')}</Badge>
                  <p className="mt-1.5 line-clamp-2 font-bold">{featuredTrail.name}</p>
                </div>
              </Card>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CloudSun, Droplets, Wind } from 'lucide-react';

import { Card, CenteredSpinner, Chip, EmptyState, SearchField } from '@/components/ui';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import { fetchWeatherParish, fetchWeatherParishes } from '@/lib/api';
import { track } from '@/lib/analytics';
import { formatAppDate, normalizeSearchText } from '@/lib/format';
import { weatherCodeEmoji, weatherCodeLabelKey } from '@/lib/weather-codes';
import type { ParishWeather } from '@/lib/types';

function useParishes() {
  return useQuery({ queryKey: ['weather', 'parishes'], queryFn: fetchWeatherParishes });
}

function ParishCard({ parish }: { parish: ParishWeather }) {
  const { t } = useTranslation();
  return (
    <Link to={`/weather/${parish.slug}`}>
      <Card className="flex items-center gap-4 p-4 transition hover:border-outline">
        <span className="text-4xl">{weatherCodeEmoji(parish.current.weatherCode)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-content">{parish.name}</p>
          <p className="truncate text-xs text-muted">{parish.concelho}</p>
          <p className="text-xs text-muted">{t(weatherCodeLabelKey(parish.current.weatherCode))}</p>
        </div>
        <span className="text-2xl font-extrabold text-content">
          {parish.current.temperature != null ? `${Math.round(parish.current.temperature)}°` : '—'}
        </span>
      </Card>
    </Link>
  );
}

export function WeatherPage() {
  const { t } = useTranslation();
  const parishes = useParishes();
  const [query, setQuery] = useState('');
  const [concelho, setConcelho] = useState<string | undefined>(undefined);

  const concelhos = useMemo(() => {
    const set = new Set((parishes.data?.parishes ?? []).map((p) => p.concelho));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt'));
  }, [parishes.data]);

  const filtered = useMemo(() => {
    const q = normalizeSearchText(query);
    return (parishes.data?.parishes ?? []).filter((p) => {
      if (concelho && p.concelho !== concelho) return false;
      if (!q) return true;
      return normalizeSearchText(`${p.name} ${p.concelho}`).includes(q);
    });
  }, [parishes.data, query, concelho]);

  useEffect(() => {
    if (!parishes.isLoading) {
      track('weather', 'view', { screen: 'list' });
    }
  }, [parishes.isLoading]);

  if (parishes.isLoading) return <CenteredSpinner />;

  return (
    <>
      <Seo modulePath="/weather" />
      <PageHeader title={t('navBarWeatherLabel')} subtitle={parishes.data?.attribution} />

      <div className="mb-5 flex flex-col gap-3">
        <SearchField
          placeholder={t('weatherSearchPlaceholder', { defaultValue: 'Search parish…' })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <Chip label={t('allLabel', { defaultValue: 'All' })} active={!concelho} onClick={() => setConcelho(undefined)} />
          {concelhos.map((c) => (
            <Chip key={c} label={c} active={concelho === c} onClick={() => setConcelho(c)} />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CloudSun} title={t('weatherEmpty', { defaultValue: 'No parishes found' })} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ParishCard key={p.slug} parish={p} />
          ))}
        </div>
      )}
    </>
  );
}

export function WeatherDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const location = useLocation();
  const returnState = location.state as { returnTo?: string; returnLabelKey?: string } | null;
  const backTo = returnState?.returnTo ?? '/weather';
  const backLabel = returnState?.returnLabelKey ? t(returnState.returnLabelKey) : t('navBarWeatherLabel');
  const parish = useQuery({
    queryKey: ['weather', 'parish', slug],
    queryFn: () => fetchWeatherParish(slug as string),
    enabled: Boolean(slug),
  });

  useEffect(() => {
    if (slug && parish.data) {
      track('weather', 'view', { screen: 'detail', slug });
    }
  }, [slug, parish.data]);

  if (parish.isLoading) return <CenteredSpinner />;
  if (!parish.data) {
    return (
      <>
        <BackLink to={backTo} label={backLabel} />
        <EmptyState icon={CloudSun} title={t('weatherNotFound', { defaultValue: 'Parish not found' })} />
      </>
    );
  }

  const p = parish.data;
  const c = p.current;

  return (
    <>
      <Seo title={`${t('navBarWeatherLabel')} — ${p.name}`} description={`${p.name}, ${p.concelho}`} />
      <BackLink to={backTo} label={backLabel} />
      <PageHeader title={p.name} subtitle={p.concelho} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <span className="text-7xl">{weatherCodeEmoji(c.weatherCode)}</span>
          <span className="text-5xl font-extrabold text-content">
            {c.temperature != null ? `${Math.round(c.temperature)}°` : '—'}
          </span>
          <span className="text-muted">{t(weatherCodeLabelKey(c.weatherCode))}</span>
          <div className="mt-3 flex gap-5 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><Wind size={16} /> {c.windSpeed ?? '—'} km/h</span>
            <span className="inline-flex items-center gap-1.5"><Droplets size={16} /> {c.humidity ?? '—'}%</span>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-bold text-content">{t('weatherForecastTitle', { defaultValue: 'Forecast' })}</h3>
          <div className="flex flex-col divide-y divide-border">
            {p.daily.map((d) => (
              <div key={d.date} className="flex items-center gap-3 py-2.5">
                <span className="w-28 text-sm text-muted">{formatAppDate(d.date)}</span>
                <span className="text-2xl">{weatherCodeEmoji(d.weatherCode)}</span>
                <span className="flex-1 text-sm text-content">{t(weatherCodeLabelKey(d.weatherCode))}</span>
                {d.precipitationProbabilityMax != null ? (
                  <span className="inline-flex items-center gap-1 text-xs text-info">
                    <Droplets size={13} /> {d.precipitationProbabilityMax}%
                  </span>
                ) : null}
                <span className="w-20 text-right text-sm font-semibold text-content">
                  {d.tempMax != null ? Math.round(d.tempMax) : '—'}° /{' '}
                  <span className="text-muted">{d.tempMin != null ? Math.round(d.tempMin) : '—'}°</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

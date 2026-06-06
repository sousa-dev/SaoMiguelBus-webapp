import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Clock, Compass, ExternalLink, Star } from 'lucide-react';

import { Badge, Button, Card, CenteredSpinner, Chip, EmptyState, SearchField } from '@/components/ui';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { fetchTour, fetchTours } from '@/lib/api';
import {
  DEFAULT_TOUR_FILTERS,
  filterAndSortTours,
  formatDuration,
  type TourSortKey,
} from '@/features/tours/filterHelpers';
import type { TourSummary } from '@/lib/types';

function TourCard({ tour }: { tour: TourSummary }) {
  const { t } = useTranslation();
  const duration = formatDuration(tour.durationMinutes, t);
  const price =
    tour.fromPrice != null
      ? t('tourFromPrice', { price: tour.fromPrice.toFixed(0), currency: tour.currency })
      : null;
  return (
    <Link to={`/tours/${encodeURIComponent(tour.code)}`}>
      <Card className="flex h-full flex-col overflow-hidden transition hover:border-outline">
        <div className="aspect-[3/2] w-full overflow-hidden bg-surface-variant">
          {tour.thumbnailUrl ? (
            <img src={tour.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 font-bold leading-snug text-content">{tour.title}</h3>
          <div className="mt-auto flex flex-wrap items-center gap-3 text-sm text-muted">
            {tour.rating != null ? (
              <span className="inline-flex items-center gap-1 text-content">
                <Star size={14} className="fill-accent text-accent" /> {tour.rating.toFixed(1)}
                {tour.reviewCount != null ? <span className="text-muted">({tour.reviewCount})</span> : null}
              </span>
            ) : null}
            {duration ? (
              <span className="inline-flex items-center gap-1">
                <Clock size={14} /> {duration}
              </span>
            ) : null}
          </div>
          {price ? <Badge tone="primary" className="self-start">{price}</Badge> : null}
        </div>
      </Card>
    </Link>
  );
}

const SORTS: { value: TourSortKey; key: string }[] = [
  { value: 'featured', key: 'toursSortFeatured' },
  { value: 'priceLow', key: 'toursSortPriceLow' },
  { value: 'priceHigh', key: 'toursSortPriceHigh' },
  { value: 'rating', key: 'toursSortRating' },
];

export function ToursPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.split('-')[0] ?? 'pt';
  const tours = useQuery({
    queryKey: ['tours', locale],
    queryFn: () => fetchTours({ locale, currency: 'EUR', limit: 30 }),
  });

  const [filters, setFilters] = useState(DEFAULT_TOUR_FILTERS);
  const visible = useMemo(
    () => filterAndSortTours(tours.data ?? [], filters),
    [tours.data, filters],
  );

  if (tours.isLoading) return <CenteredSpinner />;

  return (
    <>
      <PageHeader title={t('toursTitle')} subtitle={t('toursSubtitle')} />

      <div className="mb-5 flex flex-col gap-3">
        <SearchField
          placeholder={t('toursSearchPlaceholder')}
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <Chip
              key={s.value}
              label={t(s.key)}
              active={filters.sort === s.value}
              onClick={() => setFilters((f) => ({ ...f, sort: s.value }))}
            />
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Compass} title={t('toursEmpty', { defaultValue: 'No experiences found' })} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((tour) => (
            <TourCard key={tour.code} tour={tour} />
          ))}
        </div>
      )}
    </>
  );
}

export function TourDetailPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.split('-')[0] ?? 'pt';
  const { code } = useParams();
  const tour = useQuery({
    queryKey: ['tour', code, locale],
    queryFn: () => fetchTour(code as string, { locale, currency: 'EUR' }),
    enabled: Boolean(code),
  });

  if (tour.isLoading) return <CenteredSpinner />;
  if (!tour.data) {
    return (
      <>
        <BackLink to="/tours" label={t('navBarToursLabel')} />
        <EmptyState icon={Compass} title={t('tourNotFound', { defaultValue: 'Experience not found' })} />
      </>
    );
  }

  const d = tour.data;
  const duration = formatDuration(d.durationMinutes, t);
  const price =
    d.fromPrice != null ? t('tourFromPrice', { price: d.fromPrice.toFixed(0), currency: d.currency }) : null;

  return (
    <>
      <BackLink to="/tours" label={t('navBarToursLabel')} />
      <div className="overflow-hidden rounded-2xl">
        <img src={d.heroUrl || d.thumbnailUrl} alt="" className="aspect-[16/7] w-full object-cover" />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-2xl font-extrabold text-content lg:text-3xl">{d.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {d.rating != null ? (
              <Badge tone="accent">
                <Star size={13} className="fill-current" /> {d.rating.toFixed(1)} ({d.reviewCount})
              </Badge>
            ) : null}
            {duration ? <Badge tone="neutral"><Clock size={13} /> {duration}</Badge> : null}
          </div>
          {d.flags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {d.flags.map((flag) => (
                <Badge key={flag} tone="success">{flag.replace(/_/g, ' ')}</Badge>
              ))}
            </div>
          ) : null}
          {d.description ? <p className="mt-4 whitespace-pre-line text-content">{d.description}</p> : null}
          {d.images.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
              {d.images.slice(0, 6).map((img, i) => (
                <img key={i} src={img.url} alt={img.caption} className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
              ))}
            </div>
          ) : null}
        </div>
        <Card className="h-fit p-5 lg:sticky lg:top-24">
          {price ? <p className="text-2xl font-extrabold text-content">{price}</p> : null}
          <p className="mb-4 text-xs text-muted">{t('tourPricePerPerson', { defaultValue: 'per person' })}</p>
          <a href={d.bookingUrl} target="_blank" rel="noreferrer">
            <Button icon={ExternalLink} className="w-full">
              {t('tourBookCta')}
            </Button>
          </a>
        </Card>
      </div>
    </>
  );
}

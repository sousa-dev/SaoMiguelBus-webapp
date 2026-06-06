import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Globe, Mail, MessageCircle, Phone, Star, Store } from 'lucide-react';

import { Badge, Button, Card, CenteredSpinner, Chip, EmptyState, SearchField, StarRating } from '@/components/ui';
import { BackLink, PageHeader } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import {
  fetchMarketplaceCategories,
  fetchProvider,
  fetchProviders,
  fetchReviews,
  submitReview,
} from '@/lib/api';
import { formatAppDate } from '@/lib/format';
import { useDebounced } from '@/hooks/useDebounced';
import type { MarketplaceProvider } from '@/lib/types';

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-lg font-bold text-primary">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function ProviderCard({ provider }: { provider: MarketplaceProvider }) {
  return (
    <Link to={`/marketplace/${provider.id}`}>
      <Card className="flex h-full gap-4 p-4 transition hover:border-outline">
        <Avatar name={provider.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold text-content">{provider.name}</p>
            {provider.isPromoted ? <Badge tone="accent">★</Badge> : null}
          </div>
          <p className="truncate text-xs text-muted">{provider.category.name}</p>
          {provider.bio ? <p className="mt-1 line-clamp-2 text-sm text-muted">{provider.bio}</p> : null}
          {provider.reviewCount > 0 ? (
            <div className="mt-1.5">
              <StarRating rating={provider.rating} count={provider.reviewCount} />
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}

export function MarketplacePage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const debouncedQ = useDebounced(query, 350);

  const categories = useQuery({ queryKey: ['marketplace', 'categories'], queryFn: fetchMarketplaceCategories });
  const providers = useQuery({
    queryKey: ['marketplace', 'providers', category, debouncedQ],
    queryFn: () => fetchProviders({ category, q: debouncedQ || undefined, limit: 50 }),
  });

  return (
    <>
      <Seo modulePath="/marketplace" />
      <PageHeader title={t('navBarMarketplaceLabel')} subtitle={t('marketplaceSubtitle', { defaultValue: 'Find trusted local service providers.' })} />

      <div className="mb-5 flex flex-col gap-3">
        <SearchField
          placeholder={t('marketplaceSearchPlaceholder', { defaultValue: 'Search services…' })}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          <Chip label={t('allLabel', { defaultValue: 'All' })} active={!category} onClick={() => setCategory(undefined)} />
          {(categories.data ?? []).map((c) => (
            <Chip key={c.id} label={c.name} active={category === c.slug} onClick={() => setCategory((cur) => (cur === c.slug ? undefined : c.slug))} />
          ))}
        </div>
      </div>

      {providers.isLoading ? (
        <CenteredSpinner />
      ) : (providers.data ?? []).length === 0 ? (
        <EmptyState icon={Store} title={t('marketplaceEmpty', { defaultValue: 'No providers found' })} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {providers.data!.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </>
  );
}

function ReviewForm({ providerId }: { providerId: number }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const mutation = useMutation({
    mutationFn: () => submitReview(providerId, { rating, text: text || undefined }),
    onSuccess: () => {
      setText('');
      void qc.invalidateQueries({ queryKey: ['marketplace', 'reviews', providerId] });
      void qc.invalidateQueries({ queryKey: ['marketplace', 'provider', providerId] });
    },
  });

  return (
    <Card className="p-5">
      <h3 className="mb-3 font-bold text-content">{t('marketplaceWriteReview', { defaultValue: 'Write a review' })}</h3>
      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star size={26} className={n <= rating ? 'fill-accent text-accent' : 'text-border'} />
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={t('marketplaceReviewPlaceholder', { defaultValue: 'Share your experience…' })}
        className="mb-3 w-full rounded-xl border border-border bg-surface p-3 text-sm text-content focus:border-primary focus:outline-none"
      />
      <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} size="sm">
        {mutation.isSuccess ? t('marketplaceReviewThanks', { defaultValue: 'Thank you!' }) : t('submitButton', { defaultValue: 'Submit' })}
      </Button>
    </Card>
  );
}

export function MarketplaceProviderPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const providerId = Number(id);

  const provider = useQuery({
    queryKey: ['marketplace', 'provider', providerId],
    queryFn: () => fetchProvider(providerId),
    enabled: Number.isFinite(providerId),
  });
  const reviews = useQuery({
    queryKey: ['marketplace', 'reviews', providerId],
    queryFn: () => fetchReviews(providerId),
    enabled: Number.isFinite(providerId),
  });

  if (provider.isLoading) return <CenteredSpinner />;
  if (!provider.data) {
    return (
      <>
        <BackLink to="/marketplace" label={t('navBarMarketplaceLabel')} />
        <EmptyState icon={Store} title={t('marketplaceNotFound', { defaultValue: 'Provider not found' })} />
      </>
    );
  }

  const p = provider.data;
  return (
    <>
      <Seo title={`${p.name} — ${p.category.name}`} description={p.bio?.slice(0, 200) || `${p.name}, ${p.category.name}`} type="article" />
      <BackLink to="/marketplace" label={t('navBarMarketplaceLabel')} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <Avatar name={p.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-extrabold text-content">{p.name}</h1>
                  {p.isPromoted ? <Badge tone="accent">★ {t('marketplacePromoted', { defaultValue: 'Promoted' })}</Badge> : null}
                </div>
                <p className="text-sm text-muted">{p.category.name}</p>
                {p.reviewCount > 0 ? <div className="mt-1"><StarRating rating={p.rating} count={p.reviewCount} /></div> : null}
              </div>
            </div>
            {p.bio ? <p className="mt-4 whitespace-pre-line text-content">{p.bio}</p> : null}
            {p.hourlyRate != null ? (
              <p className="mt-3 font-semibold text-content">
                {t('marketplaceHourlyRate', { rate: p.hourlyRate, defaultValue: `€${p.hourlyRate}/h` })}
              </p>
            ) : null}
          </Card>

          <div className="mt-5">
            <h2 className="mb-3 text-lg font-bold text-content">{t('marketplaceReviews', { defaultValue: 'Reviews' })}</h2>
            {reviews.data && reviews.data.length > 0 ? (
              <div className="flex flex-col gap-3">
                {reviews.data.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-accent">{'★'.repeat(r.rating)}</span>
                      <span className="text-xs text-muted">{formatAppDate(r.createdAt)}</span>
                    </div>
                    {r.text ? <p className="text-sm text-content">{r.text}</p> : null}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{t('marketplaceNoReviews', { defaultValue: 'No reviews yet.' })}</p>
            )}
            <div className="mt-4">
              <ReviewForm providerId={providerId} />
            </div>
          </div>
        </div>

        <Card className="h-fit p-5 lg:sticky lg:top-24">
          <h3 className="mb-3 font-bold text-content">{t('marketplaceContact', { defaultValue: 'Contact' })}</h3>
          <div className="flex flex-col gap-2">
            {p.phone ? (
              <a href={`tel:${p.phone}`} className="flex items-center gap-2 rounded-xl bg-surface-variant px-3 py-2.5 text-sm font-medium text-content hover:bg-border">
                <Phone size={16} className="text-primary" /> {p.phone}
              </a>
            ) : null}
            {p.whatsapp ? (
              <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-surface-variant px-3 py-2.5 text-sm font-medium text-content hover:bg-border">
                <MessageCircle size={16} className="text-success" /> WhatsApp
              </a>
            ) : null}
            {p.email ? (
              <a href={`mailto:${p.email}`} className="flex items-center gap-2 rounded-xl bg-surface-variant px-3 py-2.5 text-sm font-medium text-content hover:bg-border">
                <Mail size={16} className="text-info" /> {p.email}
              </a>
            ) : null}
            {p.website ? (
              <a href={p.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-surface-variant px-3 py-2.5 text-sm font-medium text-content hover:bg-border">
                <Globe size={16} className="text-primary" /> {t('marketplaceWebsite', { defaultValue: 'Website' })}
              </a>
            ) : null}
          </div>
        </Card>
      </div>
    </>
  );
}

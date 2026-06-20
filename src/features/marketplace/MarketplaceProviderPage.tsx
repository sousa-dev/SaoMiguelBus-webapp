import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Globe, Mail, MessageCircle, Phone, Star, Store } from 'lucide-react';

import { Badge, Button, Card, CenteredSpinner, EmptyState, StarRating } from '@/components/ui';
import { BackLink } from '@/components/layout/Page';
import { Seo } from '@/components/Seo';
import { VerifiedByOwnerBadge } from '@/features/marketplace/VerifiedByOwnerBadge';
import { fetchProvider, fetchReviews, submitReview } from '@/lib/api';
import { track } from '@/lib/analytics';
import { formatAppDate } from '@/lib/format';

function ReviewForm({ providerId }: { providerId: number }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const mutation = useMutation({
    mutationFn: () => submitReview(providerId, { rating, text: text || undefined }),
    onSuccess: () => {
      track('marketplace', 'engage', { action: 'review', provider_id: providerId, rating });
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

  const trackContact = (action: string) => {
    track('marketplace', 'engage', { action, provider_id: p.id });
  };

  return (
    <>
      <Seo title={`${p.name} — ${p.category.name}`} description={p.bio?.slice(0, 200) || `${p.name}, ${p.category.name}`} type="article" />
      <BackLink to="/marketplace" label={t('navBarMarketplaceLabel')} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <Card className="p-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold text-content">{p.name}</h1>
                {p.isPromoted ? (
                  <Badge tone="accent">★ {t('marketplacePromoted', { defaultValue: 'Featured' })}</Badge>
                ) : null}
                {p.verifiedByOwner ? <VerifiedByOwnerBadge /> : null}
              </div>
              <p className="text-sm text-muted">{p.category.name}</p>
              {p.reviewCount > 0 ? (
                <StarRating rating={p.rating} count={p.reviewCount} />
              ) : (
                <p className="text-sm text-muted">{t('marketplaceNoReviews', { defaultValue: 'No reviews yet.' })}</p>
              )}
            </div>
            {p.bio ? <p className="mt-4 whitespace-pre-line text-content">{p.bio}</p> : null}
            {p.hourlyRate != null ? (
              <p className="mt-3 font-semibold text-content">
                {t('marketplaceRateLabel', { rate: p.hourlyRate, defaultValue: `€${p.hourlyRate}/h` })}
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
              <a href={`tel:${p.phone}`} onClick={() => trackContact('call')} className="flex items-center gap-2 rounded-xl bg-surface-variant px-3 py-2.5 text-sm font-medium text-content hover:bg-border">
                <Phone size={16} className="text-primary" /> {p.phone}
              </a>
            ) : null}
            {p.whatsapp ? (
              <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" onClick={() => trackContact('whatsapp')} className="flex items-center gap-2 rounded-xl bg-surface-variant px-3 py-2.5 text-sm font-medium text-content hover:bg-border">
                <MessageCircle size={16} className="text-success" /> WhatsApp
              </a>
            ) : null}
            {p.email ? (
              <a href={`mailto:${p.email}`} onClick={() => trackContact('email')} className="flex items-center gap-2 rounded-xl bg-surface-variant px-3 py-2.5 text-sm font-medium text-content hover:bg-border">
                <Mail size={16} className="text-info" /> {p.email}
              </a>
            ) : null}
            {p.website ? (
              <a href={p.website} target="_blank" rel="noreferrer" onClick={() => trackContact('website')} className="flex items-center gap-2 rounded-xl bg-surface-variant px-3 py-2.5 text-sm font-medium text-content hover:bg-border">
                <Globe size={16} className="text-primary" /> {t('marketplaceWebsite', { defaultValue: 'Website' })}
              </a>
            ) : null}
            {p.latitude != null && p.longitude != null ? (
              <a
                href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackContact('directions')}
                className="flex items-center gap-2 rounded-xl bg-surface-variant px-3 py-2.5 text-sm font-medium text-content hover:bg-border"
              >
                {t('marketplaceContactDirections', { defaultValue: 'Directions' })}
              </a>
            ) : null}
          </div>
        </Card>
      </div>
    </>
  );
}

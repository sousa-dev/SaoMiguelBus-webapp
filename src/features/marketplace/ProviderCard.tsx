import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge, Card, StarRating } from '@/components/ui';
import { VerifiedByOwnerBadge } from '@/features/marketplace/VerifiedByOwnerBadge';
import type { MarketplaceProvider } from '@/lib/types';

export function ProviderCard({ provider }: { provider: MarketplaceProvider }) {
  const { t } = useTranslation();

  return (
    <Link to={`/marketplace/${provider.id}`}>
      <Card className="flex h-full flex-col gap-3 p-4 transition hover:border-outline">
        <div className="flex flex-wrap items-start gap-2">
          <h3 className="line-clamp-2 flex-1 font-bold leading-snug text-content">{provider.name}</h3>
          {provider.isPromoted ? (
            <Badge tone="accent">{t('marketplacePromoted', { defaultValue: 'Featured' })}</Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{provider.category.name}</Badge>
          {provider.verifiedByOwner ? <VerifiedByOwnerBadge /> : null}
        </div>
        {provider.bio ? <p className="line-clamp-2 text-sm text-muted">{provider.bio}</p> : null}
        {provider.hourlyRate != null ? (
          <p className="text-sm text-content">
            {t('marketplaceRateLabel', { rate: provider.hourlyRate, defaultValue: `€${provider.hourlyRate}/h` })}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          {provider.reviewCount > 0 ? (
            <StarRating rating={provider.rating} count={provider.reviewCount} />
          ) : (
            <span className="text-xs text-muted">{t('marketplaceNoReviews', { defaultValue: 'No reviews yet' })}</span>
          )}
          <div className="flex gap-1 text-primary">
            {provider.phone ? <Phone size={16} aria-hidden /> : null}
            {provider.whatsapp ? <MessageCircle size={16} aria-hidden /> : null}
            {provider.email ? <Mail size={16} aria-hidden /> : null}
            {provider.latitude != null && provider.longitude != null ? <MapPin size={16} aria-hidden /> : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}

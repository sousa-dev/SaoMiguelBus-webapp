import { Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, Card } from '@/components/ui';
import { MARKETPLACE_REGISTER_URL, shareMarketplaceListingInvite } from '@/features/marketplace/share-listing-invite';

export function MarketplaceRegisterCta({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const { t } = useTranslation();

  const onShare = () =>
    void shareMarketplaceListingInvite(
      t('fabShareMarketplaceInviteMessage', {
        url: MARKETPLACE_REGISTER_URL,
        defaultValue: `Register a local business: ${MARKETPLACE_REGISTER_URL}`,
      }),
      t('fabShareMarketplaceInvite', { defaultValue: 'Share registration link' }),
    );

  if (variant === 'compact') {
    return (
      <Card className="flex flex-col gap-3 p-4 md:col-span-2">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-primary">
            <Store size={20} />
          </span>
          <p className="font-medium text-content">
            {t('marketplaceRegisterCtaCompactTitle', {
              defaultValue: 'Know a local business? Add it to the directory.',
            })}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={onShare}>
            {t('marketplaceRegisterCtaShare', { defaultValue: 'Share registration link' })}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6 flex flex-col items-center gap-4 p-6 text-center md:col-span-2">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/12 text-primary">
        <Store size={24} />
      </span>
      <div>
        <h3 className="font-bold text-content">
          {t('marketplaceRegisterCtaTitle', { defaultValue: 'Want to register a business here?' })}
        </h3>
        <p className="mt-2 text-sm text-muted">
          {t('marketplaceRegisterCtaBody', {
            defaultValue:
              "You can register any local business or service on the island — it doesn't have to be yours.",
          })}
        </p>
      </div>
      <Button onClick={onShare} className="w-full max-w-sm">
        {t('marketplaceRegisterCtaShare', { defaultValue: 'Share registration link' })}
      </Button>
    </Card>
  );
}

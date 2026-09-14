import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';

import { Badge, Button } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';
import { PREMIUM_FEATURE_COPY, type PremiumFeature } from '@/features/premium/lib/premium-gate-dialog-store';

type Props = {
  open: boolean;
  feature: PremiumFeature;
  onContinue: () => void;
};

/**
 * Blocking explainer shown to free riders before the paywall: what the tapped button does,
 * a "premium feature" badge, and a single Continue that hands over to the paywall.
 */
export function PremiumGateDialog({ open, feature, onContinue }: Props) {
  const { t } = useTranslation();
  const copy = PREMIUM_FEATURE_COPY[feature];

  return (
    <Dialog
      open={open}
      onClose={onContinue}
      dismissable={false}
      size="sm"
      title={t(copy.title)}
      footer={
        <Button variant="primary" onClick={onContinue} className="w-full sm:w-auto">
          {t('premiumGateContinue')}
        </Button>
      }
    >
      <Badge tone="accent" className="mb-3">
        <Sparkles size={12} strokeWidth={2.5} />
        {t('premiumGateBadge')}
      </Badge>
      <p className="text-muted">{t(copy.body)}</p>
    </Dialog>
  );
}

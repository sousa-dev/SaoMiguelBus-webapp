import { useEffect } from 'react';

import { PremiumGateDialog } from '@/features/premium/components/PremiumGateDialog';
import { usePremiumGateDialogStore } from '@/features/premium/lib/premium-gate-dialog-store';
import { track } from '@/lib/analytics';

/** Mount once in the shell; renders the premium explainer driven by `openPremiumGateDialog()`. */
export function PremiumGateDialogHost() {
  const open = usePremiumGateDialogStore((s) => s.open);
  const feature = usePremiumGateDialogStore((s) => s.feature);
  const source = usePremiumGateDialogStore((s) => s.source);
  const onContinue = usePremiumGateDialogStore((s) => s.onContinue);
  const openCount = usePremiumGateDialogStore((s) => s.openCount);
  const close = usePremiumGateDialogStore((s) => s.close);

  useEffect(() => {
    if (open) track('premium', 'gate_explainer_open', { feature, source });
  }, [open, openCount, feature, source]);

  if (!open || !feature) return null;

  const handleContinue = () => {
    track('premium', 'gate_explainer_continue', { feature, source });
    close();
    onContinue?.();
  };

  return <PremiumGateDialog key={openCount} open={open} feature={feature} onContinue={handleContinue} />;
}

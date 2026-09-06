import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';

import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/features/account/auth-store';
import {
  clearPendingLegacyPremiumEmail,
  getPendingLegacyPremiumEmail,
  migrateLegacyPremiumCookie,
} from '@/features/account/lib/legacy-premium-cookie';
import { openSignInDialog } from '@/features/account/lib/sign-in-dialog-store';

/**
 * One-time card for visitors who still carry the retired `premiumEmail` cookie: premium now
 * follows the account, so offer a prefilled sign-in with that email.
 */
export function LegacyPremiumNotice() {
  const { t } = useTranslation();
  const isSignedIn = useAuthStore((s) => Boolean(s.token));
  const [email, setEmail] = useState<string | null>(() => {
    migrateLegacyPremiumCookie();
    return getPendingLegacyPremiumEmail();
  });

  if (!email || isSignedIn) return null;

  const dismiss = () => {
    clearPendingLegacyPremiumEmail();
    setEmail(null);
  };

  return (
    <Card className="flex flex-col gap-3 border-accent/40 p-4 sm:flex-row sm:items-center">
      <Crown size={22} className="shrink-0 text-accent" strokeWidth={2.5} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-content">{t('legacyPremiumNoticeTitle')}</p>
        <p className="text-xs text-muted">{t('legacyPremiumNoticeBody', { email })}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          onClick={() =>
            openSignInDialog({ reason: 'legacy', prefillEmail: email, onSuccess: dismiss })
          }
        >
          {t('legacyPremiumNoticeCta')}
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          {t('legacyPremiumNoticeDismiss')}
        </Button>
      </div>
    </Card>
  );
}

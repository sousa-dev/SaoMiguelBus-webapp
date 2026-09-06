import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, ShieldCheck, Trash2, UserCircle } from 'lucide-react';

import { Badge, Button, Card } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { PremiumBadge } from '@/features/account/components/PremiumBadge';
import { useAuth } from '@/features/account/hooks/useAuth';
import { authErrorFromUnknown, formatAuthErrorMessage } from '@/features/account/lib/auth-errors';
import { openSignInDialog } from '@/features/account/lib/sign-in-dialog-store';
import { usePremium } from '@/features/premium/usePremium';
import { showNotice } from '@/lib/notice-store';

/** Settings block mirroring the Expo `AccountSection`: profile + sign out + delete, or a sign-in row. */
export function AccountSection() {
  const { t } = useTranslation();
  const { user, isSignedIn, logout, deleteAccount } = useAuth();
  const isPremium = usePremium();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onDelete = async () => {
    try {
      await deleteAccount.mutateAsync();
      setConfirmDelete(false);
    } catch (error) {
      setConfirmDelete(false);
      showNotice({
        title: t('authDeleteAccountErrorTitle'),
        message: formatAuthErrorMessage(authErrorFromUnknown(error), t),
      });
    }
  };

  return (
    <Card as="section" className="p-5">
      <h2 className="mb-3 text-base font-bold text-content">{t('accountSection')}</h2>
      {isSignedIn && user ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <UserCircle size={36} className="shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-content">{user.displayName}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {user.isSuperuser ? (
                <Badge tone="info">
                  <ShieldCheck size={12} /> {t('accountAdminBadge')}
                </Badge>
              ) : null}
              <PremiumBadge />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={LogOut}
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {t('authSignOut')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              className="text-danger"
              onClick={() => setConfirmDelete(true)}
            >
              {t('authDeleteAccount')}
            </Button>
          </div>
          <p className="text-xs text-muted">{t('authDeleteAccountSubtitle')}</p>
          <ConfirmDialog
            open={confirmDelete}
            title={t('authDeleteAccountConfirmTitle')}
            message={t('authDeleteAccountConfirmMessage')}
            confirmLabel={t('authDeleteAccountConfirm')}
            cancelLabel={t('cancel')}
            destructive
            busy={deleteAccount.isPending}
            onConfirm={() => void onDelete()}
            onCancel={() => setConfirmDelete(false)}
          />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {isPremium ? t('authSignInSubtitlePremium') : t('authSignInSubtitle')}
          </p>
          <Button size="sm" onClick={() => openSignInDialog({ reason: 'settings' })}>
            {t('authSignInCta')}
          </Button>
        </div>
      )}
    </Card>
  );
}

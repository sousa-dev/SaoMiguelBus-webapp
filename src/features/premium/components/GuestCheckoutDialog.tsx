import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/cn';

/** Collects just an email so a purchase can start before the buyer picks a password. */
export function GuestCheckoutDialog({
  open,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (email: string) => void;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pending || !email.trim()) return;
    onSubmit(email.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('premiumGuestCheckoutTitle')} closeLabel={t('close')}>
      <p className="mb-4 text-sm text-muted">{t('premiumGuestCheckoutBody')}</p>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          required
          placeholder={t('authEmailLabel')}
          className={cn(
            'h-11 w-full rounded-xl border bg-background px-3 text-sm text-content outline-none transition focus:border-primary',
            error ? 'border-danger' : 'border-border',
          )}
        />
        {error ? (
          <p role="alert" className="rounded-xl bg-danger-surface px-3 py-2 text-xs text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending || !email.trim()}>
          {t('premiumContinueButton')}
        </Button>
      </form>
    </Dialog>
  );
}

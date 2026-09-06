import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/cn';

/** Shown right after a guest-checkout purchase so the new (passwordless) account becomes usable later. */
export function SetPasswordDialog({
  open,
  email,
  pending,
  error,
  onClose,
  onSkip,
  onSubmit,
}: {
  open: boolean;
  email: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSkip: () => void;
  onSubmit: (password: string) => void;
}) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pending || password.length < 8) return;
    onSubmit(password);
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('premiumSetPasswordTitle')} closeLabel={t('close')}>
      <p className="mb-4 text-sm text-muted">{t('premiumSetPasswordBody', { email })}</p>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          autoFocus
          required
          minLength={8}
          placeholder={t('authPasswordLabel')}
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
        <Button type="submit" disabled={pending || password.length < 8}>
          {t('premiumSetPasswordTitle')}
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="self-center text-xs text-muted underline-offset-2 hover:underline"
        >
          {t('premiumSetPasswordSkip')}
        </button>
      </form>
    </Dialog>
  );
}

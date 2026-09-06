import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';

import { Button, SegmentedControl } from '@/components/ui';
import { Dialog } from '@/components/ui/Dialog';
import { useAuth } from '@/features/account/hooks/useAuth';
import {
  authErrorFromUnknown,
  formatAuthErrorMessage,
  type AuthUiError,
} from '@/features/account/lib/auth-errors';
import type { SignInMode } from '@/features/account/lib/sign-in-dialog-store';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';

type Props = {
  open: boolean;
  mode: SignInMode;
  onModeChange: (mode: SignInMode) => void;
  prefillEmail?: string;
  reason: string;
  onClose: () => void;
  onSuccess?: () => void;
};

const inputClass =
  'h-11 w-full rounded-xl border bg-background px-3 text-sm text-content outline-none transition focus:border-primary';

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {children}
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}

/** Email + password sign-in / registration. Social providers are mobile-only for now. */
export function SignInDialog({
  open,
  mode,
  onModeChange,
  prefillEmail = '',
  reason,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<AuthUiError | null>(null);

  const pending = login.isPending || register.isPending;
  const errorText = error ? formatAuthErrorMessage(error, t) : undefined;
  const emailError = error?.field === 'email' ? errorText : undefined;
  const passwordError = error?.field === 'password' ? errorText : undefined;
  const generalError = error?.field === null ? errorText : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    try {
      if (mode === 'login') {
        await login.mutateAsync({ email: email.trim(), password });
      } else {
        await register.mutateAsync({
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined,
        });
      }
      track('app', 'sign_in_success', { mode, reason });
      onSuccess?.();
      onClose();
    } catch (caught) {
      const ui = authErrorFromUnknown(caught);
      setError(ui);
      track('app', 'sign_in_error', { mode, reason, code: ui.code });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={mode === 'login' ? t('authSignIn') : t('authCreateAccount')}
      closeLabel={t('close')}
    >
      <p className="mb-4 text-muted">
        {reason === 'purchase' ? t('authIntroPurchase') : t('authIntro')}
      </p>
      <div className="mb-4">
        <SegmentedControl<SignInMode>
          value={mode}
          onChange={(next) => {
            setError(null);
            onModeChange(next);
          }}
          options={[
            { value: 'login', label: t('authSignIn') },
            { value: 'register', label: t('authCreateAccount') },
          ]}
        />
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        {mode === 'register' ? (
          <Field label={t('authNameLabel')}>
            <input
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              className={cn(inputClass, 'border-border')}
            />
          </Field>
        ) : null}
        <Field label={t('authEmailLabel')} error={emailError}>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            aria-invalid={emailError ? 'true' : undefined}
            className={cn(inputClass, emailError ? 'border-danger' : 'border-border')}
          />
        </Field>
        <Field label={t('authPasswordLabel')} error={passwordError}>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'register' ? 8 : undefined}
              aria-invalid={passwordError ? 'true' : undefined}
              className={cn(inputClass, 'pr-10', passwordError ? 'border-danger' : 'border-border')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('authHidePassword') : t('authShowPassword')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-content"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        {generalError ? (
          <p role="alert" className="rounded-xl bg-danger-surface px-3 py-2 text-xs text-danger">
            {generalError}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="mt-1">
          {mode === 'login' ? t('authSignIn') : t('authCreateAccount')}
        </Button>
      </form>
    </Dialog>
  );
}

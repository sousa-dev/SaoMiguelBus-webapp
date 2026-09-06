import { useEffect } from 'react';

import { SignInDialog } from '@/features/account/components/SignInDialog';
import { useSignInDialogStore } from '@/features/account/lib/sign-in-dialog-store';
import { track } from '@/lib/analytics';

/** Mount once in the shell; renders the global sign-in dialog driven by `openSignInDialog()`. */
export function SignInDialogHost() {
  const open = useSignInDialogStore((s) => s.open);
  const mode = useSignInDialogStore((s) => s.mode);
  const prefillEmail = useSignInDialogStore((s) => s.prefillEmail);
  const reason = useSignInDialogStore((s) => s.reason);
  const onSuccess = useSignInDialogStore((s) => s.onSuccess);
  const openCount = useSignInDialogStore((s) => s.openCount);
  const setMode = useSignInDialogStore((s) => s.setMode);
  const close = useSignInDialogStore((s) => s.close);

  useEffect(() => {
    if (open) track('app', 'sign_in_open', { reason });
  }, [open, openCount, reason]);

  if (!open) return null;

  return (
    <SignInDialog
      key={openCount}
      open={open}
      mode={mode}
      onModeChange={setMode}
      prefillEmail={prefillEmail}
      reason={reason}
      onClose={close}
      onSuccess={onSuccess ?? undefined}
    />
  );
}

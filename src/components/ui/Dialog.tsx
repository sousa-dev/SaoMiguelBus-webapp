import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

const FOCUSABLE =
  'input:not([disabled]),button:not([disabled]),select,textarea,a[href],[tabindex]:not([tabindex="-1"])';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  /** Right-aligned action row under the body. */
  footer?: ReactNode;
  size?: 'sm' | 'md';
  closeLabel?: string;
};

/**
 * The one modal primitive: portal into `document.body`, `role="dialog"`, Escape and backdrop
 * close, scroll lock, focus moved in on open and restored on close. Sits above the consent
 * banner (z-1200) and the ad overlays (z-1300/1350).
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeLabel = 'Close',
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusTo.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[1400] flex items-end justify-center p-4 sm:items-center">
      <div data-dialog-backdrop className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-2xl border border-border bg-surface p-5 shadow-xl outline-none',
          size === 'sm' ? 'max-w-sm' : 'max-w-md',
        )}
      >
        <h2 id={titleId} className="mb-3 pr-8 text-lg font-extrabold text-content">
          {title}
        </h2>
        <div className="text-sm text-content">{children}</div>
        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
        {/* Rendered last on purpose: the first button in DOM order stays the primary action. */}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-3 top-3 rounded-lg p-1 text-muted hover:bg-surface-variant"
        >
          <X size={18} />
        </button>
      </div>
    </div>,
    document.body,
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      closeLabel={cancelLabel}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-muted">{message}</p>
    </Dialog>
  );
}

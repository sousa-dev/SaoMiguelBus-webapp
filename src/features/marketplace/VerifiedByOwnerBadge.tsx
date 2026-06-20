import { CircleCheck } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const TOOLTIP_MAX_WIDTH = 280;
const VIEWPORT_MARGIN = 16;
const GAP = 8;

function computeTooltipStyle(anchor: DOMRect): CSSProperties {
  const maxWidth = Math.min(TOOLTIP_MAX_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
  let left = anchor.left;
  if (left + maxWidth > window.innerWidth - VIEWPORT_MARGIN) {
    left = window.innerWidth - maxWidth - VIEWPORT_MARGIN;
  }
  left = Math.max(VIEWPORT_MARGIN, left);

  const belowTop = anchor.bottom + GAP;
  const estimatedHeight = 72;
  const fitsBelow = belowTop + estimatedHeight <= window.innerHeight - VIEWPORT_MARGIN;
  const top = fitsBelow ? belowTop : anchor.top - GAP;

  return {
    position: 'fixed',
    top,
    left,
    maxWidth,
    width: 'max-content',
    zIndex: 9999,
    transform: fitsBelow ? undefined : 'translateY(-100%)',
  };
}

export function VerifiedByOwnerBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const tooltipText = t('marketplaceVerifiedTooltip', {
    defaultValue: 'This check means this listing was verified by the owner of the business',
  });

  const updatePosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }
    setTooltipStyle(computeTooltipStyle(anchor.getBoundingClientRect()));
  };

  useLayoutEffect(() => {
    if (!open) {
      setTooltipStyle(null);
      return;
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, tooltipText]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const timer = window.setTimeout(() => {
      document.addEventListener('click', close);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('click', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={t('marketplaceVerifiedBadge', { defaultValue: 'Verified' })}
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={`inline-flex text-success transition hover:opacity-80 ${className ?? ''}`}
      >
        <CircleCheck size={18} strokeWidth={2.5} aria-hidden />
      </button>
      {open && tooltipStyle
        ? createPortal(
            <div
              role="tooltip"
              style={tooltipStyle}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs leading-snug break-words text-content shadow-lg"
            >
              {tooltipText}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

import type { ReactNode, Ref } from 'react';

import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';

type Props = {
  ref?: Ref<HTMLDivElement>;
  /** Reserved height in px. Undefined until the container has been measured (CSS min-height applies). */
  height?: number;
  /** "Ad" badge. Omit when the child already carries its own (the house creative). */
  label?: string;
  /** Show the skeleton behind the content (while a network request is in flight). */
  busy: boolean;
  children?: ReactNode;
  className?: string;
};

/**
 * Fixed-height wrapper for a network ad unit: reserves the space up front so a fill, an unfilled
 * fallback to the house creative, or an ad blocker never shift the content below it.
 */
export function AdSlotFrame({ ref, height, label, busy, children, className }: Props) {
  return (
    <div
      ref={ref}
      className={cn('ad-frame relative w-full overflow-hidden rounded-xl', className)}
      style={height ? { height } : undefined}
      aria-busy={busy || undefined}
    >
      {busy ? <Skeleton className="absolute inset-0 rounded-xl" /> : null}
      <div className="relative flex h-full w-full items-center justify-center">{children}</div>
      {label ? (
        <span className="pointer-events-none absolute right-0 top-0 rounded-bl-lg rounded-tr-xl bg-black/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/85">
          {label}
        </span>
      ) : null}
    </div>
  );
}

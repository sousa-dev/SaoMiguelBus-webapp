import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import { Badge, Card } from '@/components/ui';
import { cn } from '@/lib/cn';

type Props = {
  icon: ReactNode;
  tone: 'primary' | 'info';
  title: string;
  subtitle?: string;
  count?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  testId?: string;
};

/** Collapsible card used by the premium widgets (web analog of `TransitCollapsibleSection`). */
export function TrackingSection({
  icon,
  tone,
  title,
  subtitle,
  count,
  defaultOpen = true,
  children,
  testId,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card as="section" className="overflow-hidden" data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white',
            tone === 'primary' ? 'bg-primary' : 'bg-info',
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-content">{title}</span>
          {subtitle ? <span className="block text-xs text-muted">{subtitle}</span> : null}
        </span>
        {count ? <Badge tone={tone === 'primary' ? 'success' : 'info'}>{count}</Badge> : null}
        <ChevronDown size={18} className={cn('shrink-0 text-muted transition', open && 'rotate-180')} />
      </button>
      {open ? <div className="flex flex-col gap-3 border-t border-border p-4">{children}</div> : null}
    </Card>
  );
}

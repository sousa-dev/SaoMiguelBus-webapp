import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/cn';

// --- Card --- //

export function Card({
  children,
  className,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-border bg-surface shadow-sm shadow-black/[0.03]',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// --- Button --- //

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'bg-surface-variant text-content hover:bg-border',
  ghost: 'bg-transparent text-content hover:bg-surface-variant',
  outline: 'border border-outline bg-surface text-content hover:bg-surface-variant',
  danger: 'bg-danger text-white hover:opacity-90',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon size={size === 'sm' ? 16 : 18} /> : null}
      {children}
    </button>
  );
}

// --- Badge --- //

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-variant text-muted',
  primary: 'bg-primary/12 text-primary',
  success: 'bg-success-surface text-success',
  warning: 'bg-warning-surface text-warning',
  danger: 'bg-danger-surface text-danger',
  info: 'bg-info-surface text-info',
  accent: 'bg-accent/20 text-on-accent',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// --- Chip (filter pill) --- //

export function Chip({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
        active
          ? 'border-primary bg-primary text-on-primary'
          : 'border-border bg-surface text-content hover:border-outline',
      )}
    >
      {Icon ? <Icon size={15} /> : null}
      {label}
    </button>
  );
}

// --- SearchField --- //

export function SearchField({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-content placeholder:text-muted focus:border-primary focus:outline-none"
        {...rest}
      />
    </div>
  );
}

// --- Spinner --- //

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn(
        'h-8 w-8 rounded-full border-[3px] border-border border-t-primary',
        className,
      )}
      style={{ animation: 'smb-spin 0.7s linear infinite' }}
    />
  );
}

export function CenteredSpinner() {
  return (
    <div className="flex w-full justify-center py-16">
      <Spinner />
    </div>
  );
}

// --- Skeleton --- //

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-variant', className)} />;
}

// --- EmptyState --- //

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
      {Icon ? <Icon size={40} className="text-muted" strokeWidth={1.5} /> : null}
      <h3 className="text-lg font-bold text-content">{title}</h3>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button variant="primary" size="sm" className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

// --- SegmentedControl --- //

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-surface-variant p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-lg px-4 py-1.5 text-sm font-semibold transition',
            value === opt.value
              ? 'bg-surface text-primary shadow-sm'
              : 'text-muted hover:text-content',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// --- StarRating --- //

export function StarRating({ rating, count }: { rating: number; count?: number | null }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-content">
      <span className="text-accent" aria-hidden>
        {'★★★★★'.slice(0, Math.floor(rounded))}
        {rounded % 1 ? '½' : ''}
      </span>
      <span className="font-semibold">{rating.toFixed(1)}</span>
      {count != null ? <span className="text-muted">({count})</span> : null}
    </span>
  );
}

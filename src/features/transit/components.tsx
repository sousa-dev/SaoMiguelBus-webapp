import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Bus,
  ChevronDown,
  MapPin,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
} from 'lucide-react';

import { Badge, Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  countTransfers,
  displayRouteNumber,
  formatTravelDuration,
  needsRouteConfirmation,
  normalizeSearchText,
  splitStopLabel,
} from '@/lib/format';
import type { Stop, TransitSearchResult } from '@/lib/types';

// --- StopPicker (autocomplete combobox) --- //

export function StopPicker({
  value,
  onChange,
  stops,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  stops: Stop[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return stops.slice(0, 8);
    return stops
      .filter((s) => normalizeSearchText(s.name).includes(q))
      .slice(0, 8);
  }, [query, stops]);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-content placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </div>
      {open && matches.length > 0 ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
          {matches.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setQuery(s.name);
                onChange(s.name);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-content hover:bg-surface-variant"
            >
              <MapPin size={15} className="text-muted" />
              {s.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// --- RouteCard --- //

function RouteTimeline({ result }: { result: TransitSearchResult }) {
  const origin = splitStopLabel(result.origin);
  const destination = splitStopLabel(result.destination);
  const duration = formatTravelDuration(result.start, result.end);
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0 text-left">
        <p className="text-lg font-bold text-content">{result.start}</p>
        <p className="truncate text-xs text-muted" title={result.origin}>
          {origin.title}
        </p>
      </div>
      <div className="flex flex-1 flex-col items-center">
        {duration ? <span className="mb-1 text-xs font-semibold text-muted">{duration}</span> : null}
        <div className="flex w-full items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="h-0.5 flex-1 bg-border" />
          <Bus size={14} className="mx-1 text-muted" />
          <span className="h-0.5 flex-1 bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
      </div>
      <div className="w-20 shrink-0 text-right">
        <p className="text-lg font-bold text-content">{result.end}</p>
        <p className="truncate text-xs text-muted" title={result.destination}>
          {destination.title}
        </p>
      </div>
    </div>
  );
}

export function RouteCard({ result }: { result: TransitSearchResult }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const transfers = countTransfers(result.route, result.stops.length);
  const lowConfidence = needsRouteConfirmation(result.likesPercent);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-2 font-bold text-on-primary">
            {displayRouteNumber(result.route)}
          </span>
          {transfers > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Bus size={15} />
              <span>
                {transfers} {transfers === 1 ? t('transfer') : t('transfers')}
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="inline-flex items-center gap-1 text-success">
            <ThumbsUp size={13} /> {Math.round(result.likesPercent)}%
          </span>
          <span className="inline-flex items-center gap-1 text-danger">
            <ThumbsDown size={13} /> {Math.round(result.dislikesPercent)}%
          </span>
        </div>
      </div>

      {lowConfidence ? (
        <div className="flex items-start gap-2 bg-warning-surface px-4 py-2 text-xs font-medium text-warning">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            <strong>{t('confirmationRequired')}</strong> — {t('confirmationMessage')}
          </span>
        </div>
      ) : null}

      <div className="px-4 py-4">
        <RouteTimeline result={result} />
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-center gap-1.5 border-t border-border py-2.5 text-sm font-semibold text-primary hover:bg-surface-variant"
      >
        {t('allStops')}
        <ChevronDown size={16} className={cn('transition', expanded && 'rotate-180')} />
      </button>

      {expanded ? (
        <div className="border-t border-border px-4 py-3">
          <ol className="relative ml-1.5 border-l-2 border-border">
            {result.stops.map((stop, idx) => {
              const label = splitStopLabel(stop.name);
              return (
                <li key={`${stop.name}-${idx}`} className="relative mb-3 pl-4 last:mb-0">
                  <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-surface bg-primary" />
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-content">{label.title}</span>
                    <span className="shrink-0 text-sm font-semibold text-muted">{stop.time}</span>
                  </div>
                  {label.subtitle ? <p className="text-xs text-muted">{label.subtitle}</p> : null}
                </li>
              );
            })}
          </ol>
          <Link
            to={`/transit/trip/${result.id}`}
            className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
          >
            {t('clickToSeeDetails')} →
          </Link>
        </div>
      ) : null}
    </Card>
  );
}

export function RouteConfidenceBadge({ result }: { result: TransitSearchResult }) {
  if (needsRouteConfirmation(result.likesPercent)) {
    return <Badge tone="warning">{Math.round(result.likesPercent)}%</Badge>;
  }
  return <Badge tone="success">{Math.round(result.likesPercent)}%</Badge>;
}

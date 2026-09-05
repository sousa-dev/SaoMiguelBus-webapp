import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, MapPin, Star, X } from 'lucide-react';

import { useDebounced } from '@/hooks/useDebounced';
import { cn } from '@/lib/cn';
import { splitStopLabel } from '@/lib/format';
import { buildFavoriteEntries, buildStopEntries, type StopListEntry } from '@/lib/stop-search';
import { useProfileStore } from '@/lib/store';
import type { Stop } from '@/lib/types';

function StopRow({
  stop,
  isFavorite,
  indented,
  onPick,
  onToggleFavorite,
}: {
  stop: Stop;
  isFavorite: boolean;
  indented?: boolean;
  onPick: (name: string) => void;
  onToggleFavorite: (stop: Stop) => void;
}) {
  const label = splitStopLabel(stop.name);
  return (
    <div
      className={cn(
        'flex items-center gap-1',
        // A favourite is marked TWICE — tinted row and a solid star. Colour alone
        // is too weak to pick a row out of a 60-row list.
        isFavorite && 'bg-accent/10',
      )}
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onPick(stop.name);
        }}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left text-sm text-content hover:bg-surface-variant',
          indented ? 'pl-8' : 'pl-3',
        )}
      >
        <MapPin size={15} className="shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate">
          {label.title}
          {label.subtitle ? <span className="text-muted"> · {label.subtitle}</span> : null}
        </span>
      </button>
      <button
        type="button"
        aria-label={stop.name}
        aria-pressed={isFavorite}
        onMouseDown={(e) => {
          e.preventDefault();
          onToggleFavorite(stop);
        }}
        className="shrink-0 px-2 py-2 text-muted hover:text-accent"
      >
        <Star size={15} className={cn(isFavorite && 'fill-accent text-accent')} />
      </button>
    </div>
  );
}

/**
 * A village section.
 *
 * The header is itself selectable: tapping it sends the raw area key to the API,
 * which does its own identical union (`resolve_stop_ids`), so a rider who only
 * knows they want "Capelas" never has to guess which of its 35 poles to name.
 * The chevron collapses the members without selecting anything.
 */
function AreaSection({
  entry,
  favoriteNames,
  onPick,
  onToggleFavorite,
}: {
  entry: Extract<StopListEntry<Stop>, { type: 'area' }>;
  favoriteNames: ReadonlySet<string>;
  onPick: (name: string) => void;
  onToggleFavorite: (stop: Stop) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(entry.key);
          }}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-3 pr-2 text-left text-sm font-semibold text-content hover:bg-surface-variant"
        >
          <MapPin size={15} className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate">{entry.key}</span>
          <span className="shrink-0 text-xs font-normal text-muted">
            {t('transitStopsCount', { count: entry.members.length })}
          </span>
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-label={entry.key}
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen((v) => !v);
          }}
          className="shrink-0 px-2 py-2 text-muted hover:text-content"
        >
          <ChevronDown size={16} className={cn('transition', open && 'rotate-180')} />
        </button>
      </div>
      {open
        ? entry.members.map((stop) => (
            <StopRow
              key={stop.name}
              stop={stop}
              indented
              isFavorite={favoriteNames.has(stop.name)}
              onPick={onPick}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        : null}
    </div>
  );
}

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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  // Debounced so a match against 816 similarly-named stops does not run between
  // keystrokes.
  const debouncedQuery = useDebounced(query, 300);

  const favoriteStops = useProfileStore((s) => s.favoriteStops);
  const toggleFavoriteStop = useProfileStore((s) => s.toggleFavoriteStop);

  const favoriteNames = useMemo(
    () => new Set(favoriteStops.map((s) => s.name)),
    [favoriteStops],
  );
  const favoriteIds = useMemo(
    () => new Set(stops.filter((s) => favoriteNames.has(s.name)).map((s) => s.id)),
    [stops, favoriteNames],
  );

  // Keyed on the DEBOUNCED query so this is a single swap rather than an empty
  // gap while the typed query catches up.
  const showingFavorites = debouncedQuery.trim().length === 0;

  const entries = useMemo(
    () =>
      showingFavorites
        ? buildFavoriteEntries(stops, favoriteStops)
        : buildStopEntries(stops, debouncedQuery, favoriteIds),
    [showingFavorites, stops, favoriteStops, debouncedQuery, favoriteIds],
  );

  const pick = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={query}
          placeholder={placeholder}
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          role="combobox"
          aria-expanded={open}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-sm text-content placeholder:text-muted focus:border-primary focus:outline-none"
        />
        {query.length > 0 ? (
          <button
            type="button"
            aria-label={t('clearInput')}
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery('');
              onChange('');
              // Stay open: clearing should land on the favourites, not on
              // nothing.
              setOpen(true);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-content"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {open && entries.length > 0 ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
          {entries.map((entry) =>
            entry.type === 'area' ? (
              <AreaSection
                key={`area-${entry.key}`}
                entry={entry}
                favoriteNames={favoriteNames}
                onPick={pick}
                onToggleFavorite={toggleFavoriteStop}
              />
            ) : (
              // Keyed on NAME, never id: the stops endpoint reuses one id across
              // a stop and its short-name aliases.
              <StopRow
                key={entry.stop.name}
                stop={entry.stop}
                isFavorite={favoriteNames.has(entry.stop.name)}
                onPick={pick}
                onToggleFavorite={toggleFavoriteStop}
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

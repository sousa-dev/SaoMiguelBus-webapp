import { useMemo, useState } from 'react';
import { MapPin, X } from 'lucide-react';

import { useDebounced } from '@/hooks/useDebounced';
import { normalizeSearchText } from '@/lib/format';

export function MinibusStopPicker({
  value,
  onChange,
  stops,
  placeholder,
  clearLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  stops: string[];
  placeholder?: string;
  clearLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const debouncedQuery = useDebounced(query, 200);

  const matches = useMemo(() => {
    const needle = normalizeSearchText(debouncedQuery);
    const filtered = needle
      ? stops.filter((name) => normalizeSearchText(name).includes(needle))
      : stops;
    return filtered.slice(0, 30);
  }, [stops, debouncedQuery]);

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
            aria-label={clearLabel}
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery('');
              onChange('');
              setOpen(true);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-content"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {open && matches.length > 0 ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
          {matches.map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(name);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-content hover:bg-surface-variant"
            >
              <MapPin size={15} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">{name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

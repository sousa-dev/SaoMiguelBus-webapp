import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';

import { LANGUAGE_NAMES, SUPPORTED_LOCALES } from '@/lib/i18n';
import { cn } from '@/lib/cn';

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = i18n.language?.split('-')[0] ?? 'pt';

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-content hover:border-outline"
      >
        <Globe size={17} />
        <span className="hidden sm:inline">{LANGUAGE_NAMES[current] ?? current}</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          {SUPPORTED_LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => {
                void i18n.changeLanguage(loc);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-surface-variant',
                loc === current ? 'font-semibold text-primary' : 'text-content',
              )}
            >
              {LANGUAGE_NAMES[loc]}
              {loc === current ? <Check size={15} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

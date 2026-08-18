import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';

import { buildMinibusDocumentFileUrl } from '../lib/documents';

/**
 * Renders a Mini Bus document image (timetable, network map, schematic) with a
 * click-to-fullscreen overlay. These images ARE the timetable — the API has no
 * per-stop departure grid — so the `alt` text carries real SEO weight.
 */
export function MinibusDocumentImage({
  documentSlug,
  alt,
  title,
  tapHint,
  fullscreenLabel,
  closeLabel,
}: {
  documentSlug: string;
  alt: string;
  title?: string;
  tapHint?: string;
  fullscreenLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const src = buildMinibusDocumentFileUrl(documentSlug);

  return (
    <div>
      {title ? <h2 className="mb-2 text-sm font-bold text-content">{title}</h2> : null}
      <button
        type="button"
        aria-label={fullscreenLabel}
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <img src={src} alt={alt} loading="lazy" className="w-full object-contain" />
        <span className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
          <Maximize2 size={12} />
          {tapHint}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}

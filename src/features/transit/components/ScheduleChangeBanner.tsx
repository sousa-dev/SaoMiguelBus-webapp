import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, X } from 'lucide-react';

import { Button } from '@/components/ui';
import { useScheduleConfig } from '@/features/transit/schedule-hooks';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';

/**
 * The changeover banner.
 *
 * Every decision — whether to show it, whether to offer the toggle, what the
 * copy says — comes from `useScheduleConfig`, which reads the server's
 * `transitSchedule`. There is no date in this file. It renders nothing until a
 * cutover instant is armed, which is why it is invisible against production
 * today even though the server is already sending banner copy.
 */
export function ScheduleChangeBanner() {
  const { t, i18n } = useTranslation();
  const {
    showBanner,
    showToggle,
    bannerText,
    isPreviewing,
    setPreviewing,
    banner,
    isBannerDismissed,
    dismissBanner,
    phase,
  } = useScheduleConfig(i18n.language);

  const warning = banner?.tone === 'warning';
  const dismissible = banner?.dismissible ?? false;

  /**
   * The announcement for the `live` phase is OURS, not the server's.
   *
   * `transitSchedule.banner` is seeded per-island and translated by whoever
   * edits it in the admin; the one sentence riders see on the day the network
   * changes is worth pinning to the app's own locale files, where all eight
   * languages are edited together. The gate is untouched — `showBanner` still
   * decides whether a banner exists at all — this only replaces the copy.
   */
  const liveText = phase === 'live' ? t('transitScheduleLiveBanner') : null;
  const announcement = liveText ?? bannerText;

  // Which explanation to show after the switch moves — null while closed.
  const [dialog, setDialog] = useState<'on' | 'off' | null>(null);

  /**
   * The single path for every way this banner can flip the preview: the switch
   * and the collapsed chip.
   *
   * The switch changes what the SEARCH returns — different routes, stops and
   * times — but the rider is looking at a banner, not at results, so nothing on
   * screen moves and the consequence only shows up later, in a search they will
   * have stopped connecting to this toggle. The dialog says it at the moment of
   * the decision. It explains rather than asks: the toggle has already applied,
   * and both directions are one click to undo.
   */
  const applyPreviewing = (next: boolean) => {
    setPreviewing(next);
    setDialog(next ? 'on' : 'off');
    track('transit', 'schedule_preview_toggled', { enabled: next, phase: phase ?? '' });
  };

  /**
   * The text follows the state: off it offers ("Show the new timetables"), on it
   * reports ("Showing the timetables in force today"). A static label next to a
   * switch makes the rider derive the current state from the thumb alone.
   */
  const toggleLabel = isPreviewing
    ? t('transitSchedulePreviewToggleOn')
    : t('transitSchedulePreviewToggle');

  const accent = warning ? 'text-warning' : 'text-primary';
  const accentBorder = warning ? 'border-warning' : 'border-primary';

  /**
   * The preview switch as ONE control, label included — the label is the only
   * thing that says what the switch does, so it has to be part of the target.
   */
  const previewToggle = (withIcon: boolean) => (
    <button
      type="button"
      role="switch"
      aria-checked={isPreviewing}
      aria-label={toggleLabel}
      onClick={() => applyPreviewing(!isPreviewing)}
      className="flex w-full items-center gap-2 py-1.5 text-left"
    >
      {withIcon ? <Info size={18} className={cn('shrink-0', accent)} /> : null}
      <span className="flex-1 text-sm font-semibold text-content">{toggleLabel}</span>
      <span
        aria-hidden
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition',
          isPreviewing ? 'bg-primary' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all',
            isPreviewing ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );

  const explainer =
    dialog !== null ? (
      <div
        className="fixed inset-0 z-[1300] flex items-end justify-center bg-black/55 p-4 sm:items-center"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-5 shadow-xl">
          <h3 className="mb-2 text-lg font-bold text-content">
            {dialog === 'off'
              ? t('transitSchedulePreviewDialogOffTitle')
              : t('transitSchedulePreviewDialogOnTitle')}
          </h3>
          <p className="mb-4 text-sm text-muted">
            {dialog === 'off'
              ? t('transitSchedulePreviewDialogOffBody')
              : t('transitSchedulePreviewDialogOnBody')}
          </p>
          <div className="flex flex-col gap-2">
            {/* Switch straight from the explanation, without hunting for the row
                behind it. `applyPreviewing` re-points `dialog`, so the sheet
                flips to the other explanation in place rather than closing.
                Dismissal stays the last, bottom-most action. */}
            {showToggle ? (
              <Button variant="outline" onClick={() => applyPreviewing(!isPreviewing)}>
                {toggleLabel}
              </Button>
            ) : null}
            <Button onClick={() => setDialog(null)}>
              {t('transitSchedulePreviewDialogAction')}
            </Button>
          </div>
        </div>
      </div>
    ) : null;

  if (!showBanner || !bannerText) {
    // The server can offer a preview before a cutover instant is armed, and the
    // banner is gated on that instant because its copy announces a dated
    // changeover. The toggle carries no such claim, so it still needs a home.
    if (!showToggle) {
      return null;
    }
    return (
      <div className={cn('mb-4 rounded-2xl border bg-surface p-4', accentBorder)}>
        {previewToggle(true)}
        {explainer}
      </div>
    );
  }

  // Dismissed collapses to a slim chip rather than disappearing: while a preview
  // is on offer, the rider needs the way back to it.
  if (dismissible && isBannerDismissed) {
    return (
      <>
        <button
          type="button"
          onClick={() => applyPreviewing(!isPreviewing)}
          className={cn(
            'mb-4 inline-flex items-center gap-1.5 rounded-lg border bg-surface px-2.5 py-1.5 text-xs font-semibold',
            accentBorder,
            accent,
          )}
        >
          <Info size={14} />
          {showToggle ? t('transitSchedulePreviewChip') : announcement}
        </button>
        {explainer}
      </>
    );
  }

  return (
    <div className={cn('mb-4 rounded-2xl border bg-surface p-4', accentBorder)}>
      <div className="flex items-center gap-2">
        <Info size={18} className={cn('shrink-0', accent)} />
        <p className="flex-1 text-sm text-content">{announcement}</p>
        {dismissible ? (
          <button
            type="button"
            aria-label={t('close', { defaultValue: 'Close' })}
            onClick={() => {
              dismissBanner();
              track('transit', 'schedule_banner_dismissed', {
                banner_id: banner?.id ?? '',
                phase: phase ?? '',
              });
            }}
            className="shrink-0 p-1 text-muted hover:text-content"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      {showToggle ? previewToggle(false) : null}
      {explainer}
    </div>
  );
}

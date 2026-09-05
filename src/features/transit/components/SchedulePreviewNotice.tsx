import { useTranslation } from 'react-i18next';
import { CalendarCheck, TriangleAlert } from 'lucide-react';

import { useScheduleConfig } from '@/features/transit/schedule-hooks';
import { formatAppDate } from '@/lib/format';

/**
 * The preview caveat, attached to the RESULTS rather than the page.
 *
 * A rider who scrolls past the banner, or shares a screenshot, must still see
 * that these times are not yet valid. The date is formatted from the server's
 * `cutoverAt` — never a literal.
 */
export function SchedulePreviewStrip() {
  const { t, i18n } = useTranslation();
  const { showPreviewWarning, config } = useScheduleConfig(i18n.language);

  if (!showPreviewWarning) {
    return null;
  }

  // The caveat must never depend on a cutover being armed. A preview can be
  // offered before the date is set, and "these times are not in force yet" is
  // exactly what the rider needs to know either way.
  const message = config?.cutoverAt
    ? t('transitSchedulePreviewWarning', { date: formatAppDate(new Date(config.cutoverAt)) })
    : t('transitSchedulePreviewWarningUndated');

  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border border-warning bg-warning-surface px-3 py-2">
      <TriangleAlert size={16} className="shrink-0 text-warning" />
      <p className="flex-1 text-xs font-medium text-content">{message}</p>
    </div>
  );
}

/** The same caveat, compressed to a chip for each result card. */
export function SchedulePreviewChip() {
  const { t, i18n } = useTranslation();
  const { showPreviewWarning } = useScheduleConfig(i18n.language);

  if (!showPreviewWarning) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-warning px-2 py-0.5 text-xs font-semibold text-warning">
      <TriangleAlert size={12} />
      {t('transitSchedulePreviewChip')}
    </span>
  );
}

/**
 * The "valid since" badge. Shown only during the live phase; it retires when the
 * server moves the phase on, not on a client-side date comparison.
 */
export function ScheduleValidBadge() {
  const { i18n } = useTranslation();
  const { showBadge, badgeText } = useScheduleConfig(i18n.language);

  if (!showBadge || !badgeText) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-primary px-2 py-0.5 text-xs font-semibold text-primary">
      <CalendarCheck size={12} />
      {badgeText}
    </span>
  );
}

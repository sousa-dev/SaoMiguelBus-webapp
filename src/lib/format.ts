/** Formatting helpers ported from the Expo app (lib/date-format, format-time, transit-format). */

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** DD/MM/YYYY — locale-independent. */
export function formatAppDate(value: string | Date): string {
  const d = toDate(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

/** DD/MM/YYYY HH:mm. */
export function formatAppDateTime(value: string | Date): string {
  const d = toDate(value);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatAppDate(d)} ${hh}:${mm}`;
}

export function formatLocalTime(value: string | Date, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
      toDate(value),
    );
  } catch {
    const d = toDate(value);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

export function formatRelativeTime(value: string | Date, locale = 'pt'): string {
  const d = toDate(value);
  const diffMs = d.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (abs < 60) return rtf.format(Math.round(diffSec), 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  return rtf.format(Math.round(diffSec / 86400), 'day');
}

// --- Transit --- //

export type DayType = 'weekday' | 'saturday' | 'sunday';

export function normalizeTripTime(time: string): string {
  if (time.includes('h')) return time;
  const [h, m] = time.split(':');
  if (h && m) return `${h}h${m}`;
  return time;
}

export function resolveDayType(date: Date, holidays?: { date: string }[]): DayType {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  if (holidays?.some((h) => h.date === iso)) return 'sunday';
  const weekday = date.getDay();
  if (weekday === 0) return 'sunday';
  if (weekday === 6) return 'saturday';
  return 'weekday';
}

/** Parses HHhMM (or HH:MM), handles overnight, returns e.g. "01h30" or "45 min". */
export function formatTravelDuration(first: string, last: string): string {
  const parse = (t: string): number | null => {
    const m = t.match(/(\d{1,2})[h:](\d{2})/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
  };
  const a = parse(first);
  const b = parse(last);
  if (a == null || b == null) return '';
  let mins = b - a;
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const mm = mins % 60;
  if (h === 0) return `${mm} min`;
  return `${String(h).padStart(2, '0')}h${String(mm).padStart(2, '0')}`;
}

/**
 * Split a stop name into what to show and what to show underneath.
 *
 * The two networks name stops differently: legacy uses `"VILLAGE - LANDMARK"`,
 * AzoresBus uses `"VILLAGE (LANDMARK)"`. Both are handled here rather than at
 * the call sites, which have no business knowing which network they are on.
 */
export function splitStopLabel(name: string): { title: string; subtitle: string | null } {
  const paren = name.indexOf(' (');
  if (paren > 0 && name.endsWith(')')) {
    const subtitle = name.slice(paren + 2, -1).trim();
    return { title: name.slice(0, paren).trim(), subtitle: subtitle || null };
  }
  const parts = name.split(' - ');
  if (parts.length <= 1) return { title: name, subtitle: null };
  return { title: parts[0] ?? name, subtitle: parts.slice(1).join(' - ') || null };
}

/** Parse `08h30` / `08:30` into minutes since midnight. */
export function timeStringToMinutes(timeString: string): number {
  const normalized = normalizeTripTime(timeString);
  const [hours, minutes] = normalized.split('h').map((part) => parseInt(part, 10));
  return (hours || 0) * 60 + (minutes || 0);
}

export function computeVotePercents(
  likes: number,
  dislikes: number,
): { likesPercent: number; dislikesPercent: number } {
  const total = likes + dislikes;
  if (total <= 0) {
    return { likesPercent: 0, dislikesPercent: 0 };
  }
  return {
    likesPercent: Math.floor((likes / total) * 100),
    dislikesPercent: Math.floor((dislikes / total) * 100),
  };
}

/** Minimal shape of i18next's `t`, so this module stays free of react-i18next. */
type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * A span of minutes as words: "17 minutes", "2 hours", "1 hour and 17 minutes".
 *
 * Built from two separately-pluralised parts joined by a locale-specific
 * conjunction, rather than one `{{hours}}h {{minutes}}` template, because the
 * singular/plural of each unit varies independently — "1 hour and 2 minutes",
 * "2 hours and 1 minute" — and no single interpolated string can express that
 * across eight languages.
 *
 * Minutes are NOT carried into the hours part as a fraction: a rider reads a
 * connection time to decide whether to leave the stop, and "1.3 hours" is not a
 * thing anyone converts back to a departure.
 */
export function formatDurationWords(t: Translate, totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;

  if (hours === 0) {
    return t('durationMinutes', { count: minutes });
  }
  const hoursPart = t('durationHours', { count: hours });
  if (minutes === 0) {
    return hoursPart;
  }
  return t('durationHoursAndMinutes', {
    hours: hoursPart,
    minutes: t('durationMinutes', { count: minutes }),
  });
}

/**
 * `start` is rounded DOWN to this many minutes, which does two jobs at once.
 *
 * It keeps a query key stable — a key carrying the live minute would refetch
 * sixty times an hour for a timetable that does not change — and it leaves a few
 * minutes of grace at the front of the list, so a bus that pulled out two
 * minutes ago is still visible to a rider who is running for it.
 */
export const DEPARTURES_START_BUCKET_MINUTES = 5;

/**
 * A clock time as the transit API's `start` parameter: `HHhMM`, bucketed.
 *
 * Local time on purpose — the timetable is written in island local time, and the
 * rider is standing at the stop.
 */
export function departuresStartTime(
  date: Date,
  bucketMinutes = DEPARTURES_START_BUCKET_MINUTES,
): string {
  const size = Math.max(1, Math.floor(bucketMinutes));
  const hours = date.getHours();
  const minutes = Math.floor(date.getMinutes() / size) * size;
  return `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}`;
}

/** The whole service day, as the API spells it. */
export const FULL_DAY_START = '00h00';

export function countTransfers(route: string, stopCount: number): number {
  const raw = route.split('/').length - 1;
  return Math.min(Math.max(raw, 0), Math.max(stopCount - 2, 0));
}

export function displayRouteNumber(route: string): string {
  return route.replace(/C/gi, '');
}

export const CONFIRMATION_LIKES_THRESHOLD = 60;

export function needsRouteConfirmation(likesPercent: number): boolean {
  return likesPercent < CONFIRMATION_LIKES_THRESHOLD;
}

// --- Search normalization (accent-insensitive) --- //

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

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

export function splitStopLabel(name: string): { title: string; subtitle: string | null } {
  const parts = name.split(' - ');
  if (parts.length <= 1) return { title: name, subtitle: null };
  return { title: parts[0] ?? name, subtitle: parts.slice(1).join(' - ') || null };
}

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

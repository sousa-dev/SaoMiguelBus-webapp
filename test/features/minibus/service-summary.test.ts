import { describe, expect, it } from 'vitest';

import { formatServiceSummary } from '@/features/minibus/lib/service-summary';

const t = (key: string, options?: Record<string, unknown>) => {
  if (key === 'minibusWeekdayHours') return `Weekdays ${options?.start}–${options?.end}`;
  if (key === 'minibusSaturdayDepartures') return `Saturdays: ${options?.times}`;
  return key;
};

describe('formatServiceSummary', () => {
  it('renders weekday hours only for a line with no Saturday service (A/B)', () => {
    const summary = formatServiceSummary({ weekday: { start: '07:30', end: '19:30' } }, t);
    expect(summary).toBe('Weekdays 07:30–19:30');
  });

  it('appends Saturday departures for a line that runs them (C/D)', () => {
    const summary = formatServiceSummary(
      {
        weekday: { start: '07:30', end: '19:30' },
        saturday_departures: ['09:00', '10:00', '11:00'],
      },
      t,
    );
    expect(summary).toBe('Weekdays 07:30–19:30 · Saturdays: 09:00, 10:00, 11:00');
  });

  it('returns an empty string when the summary carries nothing', () => {
    expect(formatServiceSummary({}, t)).toBe('');
    expect(formatServiceSummary({ saturday_departures: [] }, t)).toBe('');
  });

  it('falls back to Saturday-only text when weekday hours are missing', () => {
    const summary = formatServiceSummary({ saturday_departures: ['09:00'] }, t);
    expect(summary).toBe('Saturdays: 09:00');
  });
});

import { describe, expect, it } from 'vitest';

import { buildStopEntries, type StopListEntry } from '@/lib/stop-search';

interface TestStop {
  id: number;
  name: string;
}

function stopsFrom(names: string[]): TestStop[] {
  return names.map((name, index) => ({ id: index + 1, name }));
}

function names(entries: StopListEntry<TestStop>[]): string[] {
  return entries.map((entry) => (entry.type === 'area' ? entry.key : entry.stop.name));
}

describe('buildStopEntries — exact-match ordering', () => {
  it('puts a stop exactly matching the query above one that merely contains it', () => {
    // "Furnas" alphabetically precedes "Lagoa" — without the exact-match tier
    // the substring match would sort first, burying the stop the query names.
    const stops = stopsFrom(['Furnas (Lagoa)', 'Lagoa']);
    const entries = buildStopEntries(stops, 'lagoa');
    expect(names(entries)).toEqual(['Lagoa', 'Furnas (Lagoa)']);
  });

  it('is case- and accent-insensitive', () => {
    const stops = stopsFrom(['Furnas (Água)', 'Água']);
    const entries = buildStopEntries(stops, 'AGUA');
    expect(names(entries)).toEqual(['Água', 'Furnas (Água)']);
  });

  it('still lets favourites outrank an exact match', () => {
    const stops = stopsFrom(['Furnas (Lagoa)', 'Lagoa']);
    const favoriteIds = new Set([stops[0]!.id]); // "Furnas (Lagoa)"
    const entries = buildStopEntries(stops, 'lagoa', favoriteIds);
    expect(names(entries)).toEqual(['Furnas (Lagoa)', 'Lagoa']);
  });

  it('ranks an exact-match area key above a substring match, below favourites', () => {
    const stops = stopsFrom(['Lagoa (Igreja)', 'Lagoa (Centro)', 'Furnas (Lagoa)']);
    const entries = buildStopEntries(stops, 'lagoa');
    expect(names(entries)).toEqual(['Lagoa', 'Furnas (Lagoa)']);
  });

  it('leaves non-exact matches in alphabetical order relative to each other', () => {
    const stops = stopsFrom(['Furnas (Lagoa)', 'Achada (Lagoa)']);
    const entries = buildStopEntries(stops, 'lagoa');
    expect(names(entries)).toEqual(['Achada (Lagoa)', 'Furnas (Lagoa)']);
  });
});

/**
 * Village-level ("area") grouping — the TS mirror of
 * `azoresbus/services_stops.py`'s `derive_area_key`/`build_area_index` on the
 * API repo. Same rule, same numbers, pinned against the SAME real fixture
 * (`test/fixtures/azoresbus/stops.json`, copied verbatim from the API repo and
 * from the Expo app — never re-captured, never fetched), so three
 * implementations of one string-normalisation rule cannot silently disagree
 * without a test noticing on every side.
 *
 * A different axis from the pole-collapse the backend does at import time
 * (1456 poles → 816 `Stop` rows by exact name) — this groups those already-
 * collapsed 816 names by a shared VILLAGE PREFIX, for search only. It never
 * merges two real stops into one.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { deriveAreaKey, findAreaByQuery, groupStopsIntoAreas } from '@/lib/stop-areas';

interface UpstreamStop {
  id: string;
  name: string;
}

function realStopNames(): string[] {
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), 'test', 'fixtures', 'azoresbus', 'stops.json'), 'utf8'),
  ) as UpstreamStop[];
  return [...new Set(raw.map((row) => row.name))].sort();
}

function stopsFrom(names: string[]): { id: number; name: string }[] {
  return names.map((name, index) => ({ id: index + 1, name }));
}

describe('deriveAreaKey', () => {
  it('splits on the first " ("', () => {
    expect(deriveAreaKey('CAPELAS (IGREJA)')).toBe('CAPELAS');
  });

  it('returns null for a bare name with no parens', () => {
    expect(deriveAreaKey('ACHADINHA')).toBeNull();
  });

  it('groups a trailing pole number after the closing paren', () => {
    // Splitting on the FIRST " (" rather than requiring the string to end in
    // ")" is what catches this.
    expect(deriveAreaKey('ARRIFES (LG. DO BOM DESPACHO) 1')).toBe('ARRIFES');
    expect(deriveAreaKey('ARRIFES (LG. DO BOM DESPACHO) 2')).toBe('ARRIFES');
  });

  it('trims whitespace before the paren', () => {
    expect(deriveAreaKey('CAPELAS  (IGREJA)')).toBe('CAPELAS');
  });
});

describe('groupStopsIntoAreas — real data, pinned against the shared fixture', () => {
  const names = realStopNames();
  const stops = stopsFrom(names);
  const areas = groupStopsIntoAreas(stops);

  it("matches the backend's real counts: 816 names, 83 areas, 765 covered", () => {
    expect(names.length).toBe(816);
    expect(areas.size).toBe(83);
    const covered = [...areas.values()].reduce((sum, members) => sum + members.length, 0);
    expect(covered).toBe(765);
  });

  it('CAPELAS has 35 members', () => {
    expect(areas.get('CAPELAS')?.length).toBe(35);
  });

  it('the largest area is ARRIFES with 47', () => {
    const [largestKey, largest] = [...areas.entries()].reduce((best, entry) =>
      entry[1].length > best[1].length ? entry : best,
    );
    expect(largestKey).toBe('ARRIFES');
    expect(largest.length).toBe(47);
  });

  it('single-member "areas" are excluded — no grouping benefit', () => {
    expect(areas.has('ACHADINHA')).toBe(false);
    expect(areas.has('ALGARVIA')).toBe(false);
  });

  it('collision-excluded areas are absent', () => {
    for (const excluded of ['AFLITOS', 'VÁRZEA', 'ACHADINHA', 'ALGARVIA', 'RIBEIRA FUNDA']) {
      expect(areas.has(excluded), excluded).toBe(false);
    }
  });

  it('every member actually belongs under its key', () => {
    for (const [key, members] of areas) {
      for (const member of members) {
        expect(deriveAreaKey(member.name), member.name).toBe(key);
      }
    }
  });

  it('is stable across input order', () => {
    const reversed = groupStopsIntoAreas([...stops].reverse());
    expect([...areas.keys()].sort()).toEqual([...reversed.keys()].sort());
    for (const key of areas.keys()) {
      expect(areas.get(key)!.length, key).toBe(reversed.get(key)!.length);
    }
  });
});

describe('groupStopsIntoAreas — collision exclusion, isolated fixtures', () => {
  it('a bare stop blocks its own area key', () => {
    const areas = groupStopsIntoAreas(
      stopsFrom(['AFLITOS', 'AFLITOS (ESCOLA)', 'AFLITOS (IGREJA)']),
    );
    expect(areas.has('AFLITOS')).toBe(false);
  });

  it('the exclusion is accent- and case-folded (foldStopName, not a bare match)', () => {
    const areas = groupStopsIntoAreas(
      stopsFrom(['Água Retorta', 'AGUA RETORTA (PORTO)', 'AGUA RETORTA (PRAIA)']),
    );
    expect(areas.size).toBe(0);
  });

  it('without a colliding bare stop, the area forms normally', () => {
    const areas = groupStopsIntoAreas(stopsFrom(['CAPELAS (IGREJA)', 'CAPELAS (MOAGEM)']));
    expect(areas.get('CAPELAS')?.length).toBe(2);
  });

  it('a single matching stop never forms an area', () => {
    const areas = groupStopsIntoAreas(stopsFrom(['CAPELAS (IGREJA)', 'ARRIFES (ESCOLA)']));
    expect(areas.size).toBe(0);
  });

  it('is generic over any stop-like shape', () => {
    const areas = groupStopsIntoAreas([
      { id: 1, name: 'CAPELAS (IGREJA)', latitude: 0, longitude: 0 },
      { id: 2, name: 'CAPELAS (MOAGEM)', latitude: 0, longitude: 0 },
    ]);
    expect(areas.get('CAPELAS')?.length).toBe(2);
  });
});

describe('findAreaByQuery — the folded lookup', () => {
  const areas = groupStopsIntoAreas(
    stopsFrom(['CAPELAS (IGREJA)', 'CAPELAS (MOAGEM)', 'ARRIFES (ESCOLA)', 'ARRIFES (IGREJA)']),
  );

  it('matches a lowercase, unaccented query against an uppercase key', () => {
    expect(findAreaByQuery(areas, 'capelas')?.length).toBe(2);
  });

  it('matches an accented query against an unaccented key and vice versa', () => {
    const withAccent = groupStopsIntoAreas(
      stopsFrom(['SÃO ROQUE (IGREJA)', 'SÃO ROQUE (ESCOLA)']),
    );
    expect(findAreaByQuery(withAccent, 'sao roque')?.length).toBe(2);
    expect(findAreaByQuery(withAccent, 'São Roque')?.length).toBe(2);
  });

  it('returns null for a query matching no area', () => {
    expect(findAreaByQuery(areas, 'zzzz')).toBeNull();
  });

  it('returns null for a query matching a member but not the area itself', () => {
    // "Igreja" is a landmark shared by multiple villages, not an area key.
    expect(findAreaByQuery(areas, 'igreja')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import {
  MINIBUS_LINE_SEO,
  MINIBUS_LINE_SEO_BY_SLUG,
  MODULE_SEO,
} from '@/lib/seo-config';

// The Mini Bus route table lives in src/App.tsx as `minibus/:slug` — line pages
// resolve there, so every catalog slug just needs to look like a route segment
// and have complete bilingual copy for the prerender pass to use.
describe('MINIBUS_LINE_SEO', () => {
  it('has one entry per catalog line with a route-safe slug', () => {
    expect(MINIBUS_LINE_SEO.map((l) => l.slug)).toEqual(['line-a', 'line-b', 'line-c', 'line-d']);
    for (const line of MINIBUS_LINE_SEO) {
      expect(line.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('is indexed by slug for O(1) lookup from the line detail page', () => {
    for (const line of MINIBUS_LINE_SEO) {
      expect(MINIBUS_LINE_SEO_BY_SLUG[line.slug]).toBe(line);
    }
  });

  it('has non-empty pt and en title/description for every line', () => {
    for (const line of MINIBUS_LINE_SEO) {
      expect(line.title.pt.length).toBeGreaterThan(0);
      expect(line.title.en.length).toBeGreaterThan(0);
      expect(line.description.pt.length).toBeGreaterThan(0);
      expect(line.description.en.length).toBeGreaterThan(0);
    }
  });
});

describe('MODULE_SEO', () => {
  it('never reuses a subdomain label across two module entries', () => {
    const subdomains = MODULE_SEO.map((m) => m.subdomain).filter((s): s is string => Boolean(s));
    expect(new Set(subdomains).size).toBe(subdomains.length);
  });

  it('never reuses a path across two module entries', () => {
    const paths = MODULE_SEO.map((m) => m.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('registers the three Mini Bus pages that get a prerendered page', () => {
    const minibusPaths = MODULE_SEO.filter((m) => m.key === 'minibus').map((m) => m.path);
    expect(minibusPaths).toEqual(['/minibus', '/minibus/search', '/minibus/schematic']);
  });
});

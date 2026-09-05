import { describe, expect, it } from 'vitest';

import { parityKey, WEB_ANALYTICS_PARITY } from '@/lib/analytics-parity';

const sourceModules = import.meta.glob('../../src/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function collectTrackCalls(): Set<string> {
  const keys = new Set<string>();
  const trackRe = /track\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]/g;

  for (const [path, text] of Object.entries(sourceModules)) {
    if (path.endsWith('/lib/analytics.ts')) continue;
    let match: RegExpExecArray | null;
    while ((match = trackRe.exec(text)) !== null) {
      keys.add(`${match[1]}/${match[2]}`);
    }
  }
  return keys;
}

describe('analytics parity checklist', () => {
  it('documents unique module/event pairs', () => {
    const keys = WEB_ANALYTICS_PARITY.map(parityKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('implements every checklist entry somewhere in src/', () => {
    const implemented = collectTrackCalls();
    const missing = WEB_ANALYTICS_PARITY.filter((entry) => !implemented.has(parityKey(entry)));
    expect(missing, `Missing track() for: ${missing.map(parityKey).join(', ')}`).toEqual([]);
  });
});

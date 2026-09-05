import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ADS_TXT = join(process.cwd(), 'public', 'ads.txt');

describe('public/ads.txt', () => {
  it('exists so nginx serves it at /ads.txt', () => {
    expect(existsSync(ADS_TXT)).toBe(true);
  });

  it('authorizes the shared Google publisher account as a direct seller', () => {
    const lines = readFileSync(ADS_TXT, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
    expect(lines).toContain('google.com, pub-8246676797736648, DIRECT, f08c47fec0942fa0');
    for (const line of lines) {
      expect(line.split(',').length, line).toBeGreaterThanOrEqual(3);
    }
  });
});

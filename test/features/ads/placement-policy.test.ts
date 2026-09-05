import { describe, expect, it } from 'vitest';

import {
  isNetworkAdAllowedOnPath,
  resolvePlacement,
} from '@/features/ads/lib/placement-policy';

describe('isNetworkAdAllowedOnPath', () => {
  it('allows module pages that carry publisher content', () => {
    for (const path of [
      '/hub',
      '/transit',
      '/transit/line/101',
      '/transit/stop/abc',
      '/minibus/search',
      '/news/42',
      '/weather',
      '/earthquakes/1',
      '/trails/2',
      '/tours/x',
      '/traffic',
      '/marketplace/9',
    ]) {
      expect(isNetworkAdAllowedOnPath(path), path).toBe(true);
    }
  });

  it('refuses the index redirect, legal pages and unknown routes', () => {
    for (const path of ['/', '/privacy.html', '/terms.html', '/does-not-exist', '/transitx']) {
      expect(isNetworkAdAllowedOnPath(path), path).toBe(false);
    }
  });
});

describe('resolvePlacement', () => {
  it('maps slot names onto placements', () => {
    expect(resolvePlacement('top')).toBe('top');
    expect(resolvePlacement('inline-3')).toBe('inline');
    expect(resolvePlacement(7)).toBe('inline');
    expect(resolvePlacement('sidebar')).toBe('sidebar');
    expect(resolvePlacement('footer')).toBe('footer');
    expect(resolvePlacement(undefined)).toBe('top');
  });
});

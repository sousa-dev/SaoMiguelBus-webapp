import { describe, expect, it } from 'vitest';

import { orderedTabModules } from '@/lib/modules';

describe('orderedTabModules', () => {
  it('returns the fixed bottom-tab modules in a stable order, filtered by what is enabled', () => {
    const modules = orderedTabModules(['minibus', 'weather', 'transit', 'news']);
    expect(modules.map((m) => m.key)).toEqual(['transit', 'minibus', 'weather']);
  });

  it('omits a fixed module entirely when it is not enabled', () => {
    expect(orderedTabModules(['transit']).map((m) => m.key)).toEqual(['transit']);
  });

  it('returns nothing when no fixed module is enabled', () => {
    expect(orderedTabModules(['news', 'trails'])).toEqual([]);
  });
});

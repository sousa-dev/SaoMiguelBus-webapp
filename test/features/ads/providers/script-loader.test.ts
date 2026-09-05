// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  loadScriptOnce,
  resetScriptLoaderForTests,
} from '@/features/ads/providers/script-loader';

const SRC = 'https://example.test/ad.js';

function scripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll('script'));
}

describe('loadScriptOnce', () => {
  beforeEach(() => {
    resetScriptLoaderForTests();
    document.head.innerHTML = '';
  });

  it('injects nothing until it is called', () => {
    expect(scripts()).toHaveLength(0);
  });

  it('appends one async script with the given attributes and resolves ready on load', async () => {
    const pending = loadScriptOnce(SRC, { attrs: { crossorigin: 'anonymous' } });
    const [script] = scripts();
    expect(script.src).toBe(SRC);
    expect(script.async).toBe(true);
    expect(script.getAttribute('crossorigin')).toBe('anonymous');

    script.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBe('ready');
  });

  it('reuses the same promise for a second call and inserts nothing new', () => {
    const first = loadScriptOnce(SRC);
    const second = loadScriptOnce(SRC);
    expect(second).toBe(first);
    expect(scripts()).toHaveLength(1);
  });

  it('resolves blocked when the script fails to load', async () => {
    const pending = loadScriptOnce(SRC);
    scripts()[0].dispatchEvent(new Event('error'));
    await expect(pending).resolves.toBe('blocked');
  });
});

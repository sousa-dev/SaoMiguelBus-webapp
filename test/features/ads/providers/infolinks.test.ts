// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { loadInfolinks } from '@/features/ads/providers/infolinks';
import { resetScriptLoaderForTests } from '@/features/ads/providers/script-loader';

function scripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll('script'));
}

describe('loadInfolinks', () => {
  beforeEach(() => {
    resetScriptLoaderForTests();
    document.head.innerHTML = '';
    delete window.infolinks_pid;
    delete window.infolinks_wsid;
  });

  it('sets the pid/wsid globals before injecting the script', async () => {
    const pending = loadInfolinks({ infolinks: { pid: '3447644', wsid: '0' } });
    expect(window.infolinks_pid).toBe(3447644);
    expect(window.infolinks_wsid).toBe(0);
    const [script] = scripts();
    expect(script.src).toBe('https://resources.infolinks.com/js/infolinks_main.js');
    script.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBe('ready');
  });

  it('defaults wsid to 0 when unset', () => {
    loadInfolinks({ infolinks: { pid: '3447644', wsid: null } });
    expect(window.infolinks_wsid).toBe(0);
  });

  it('does nothing and resolves blocked when no pid is configured', async () => {
    await expect(loadInfolinks({ infolinks: { pid: null, wsid: null } })).resolves.toBe('blocked');
    expect(scripts()).toHaveLength(0);
  });
});

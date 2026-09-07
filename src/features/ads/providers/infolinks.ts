import { loadScriptOnce } from '@/features/ads/providers/script-loader';
import type { WebAdConfig } from '@/features/ads/providers/types';

const SCRIPT_SRC = 'https://resources.infolinks.com/js/infolinks_main.js';

declare global {
  interface Window {
    infolinks_pid?: number;
    infolinks_wsid?: number;
  }
}

/**
 * Sets the two globals Infolinks' own script reads on load, then injects that script. There is no
 * per-slot API to wire into `WebAdProvider` — it scans the page's own text and injects its in-text
 * units itself, so this is called once from `InfolinksScript`, not from the banner waterfall.
 */
export function loadInfolinks(config: Pick<WebAdConfig, 'infolinks'>): Promise<'ready' | 'blocked'> {
  const { pid, wsid } = config.infolinks;
  if (typeof window === 'undefined' || pid == null) return Promise.resolve('blocked');
  window.infolinks_pid = Number(pid);
  window.infolinks_wsid = wsid == null ? 0 : Number(wsid);
  return loadScriptOnce(SCRIPT_SRC);
}

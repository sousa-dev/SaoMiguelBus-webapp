export type ScriptLoadResult = 'ready' | 'blocked';

const pending = new Map<string, Promise<ScriptLoadResult>>();

/**
 * Appends `<script async src>` once per `src` and resolves `ready` on load or `blocked` on error
 * (ad blockers, offline). Repeated calls share the first promise, so route changes never inject a
 * second copy. Without a document (prerender, node tests) it resolves `blocked` and touches nothing.
 */
export function loadScriptOnce(
  src: string,
  options: { attrs?: Record<string, string> } = {},
): Promise<ScriptLoadResult> {
  const existing = pending.get(src);
  if (existing) return existing;

  if (typeof document === 'undefined') {
    return Promise.resolve('blocked');
  }

  const promise = new Promise<ScriptLoadResult>((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    for (const [name, value] of Object.entries(options.attrs ?? {})) {
      script.setAttribute(name, value);
    }
    script.addEventListener('load', () => resolve('ready'), { once: true });
    script.addEventListener('error', () => resolve('blocked'), { once: true });
    document.head.appendChild(script);
  });

  pending.set(src, promise);
  return promise;
}

export function resetScriptLoaderForTests(): void {
  pending.clear();
}

import { useEffect, useMemo, useRef } from 'react';

import type { NetworkSlotProps, WebAdConfig, WebAdProvider } from '@/features/ads/providers/types';

const DEFAULT_TIMEOUT_MS = 8_000;

/** `//pl123.profitablecpmrate.com/<32 hex>/invoke.js` → the hex key, or null when it is not an Adsterra tag. */
export function adsterraKeyFromInvoke(invokeUrl: string): string | null {
  const match = /\/([0-9a-f]{32})\/invoke\.js(?:[?#].*)?$/i.exec(invokeUrl);
  return match ? match[1].toLowerCase() : null;
}

/** Adsterra's Native Banner tag fills `#container-<key>`. */
export function adsterraContainerId(invokeUrl: string): string {
  return `container-${adsterraKeyFromInvoke(invokeUrl) ?? 'unknown'}`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * A self-contained document for one unit. Adsterra tags use a page-global (`atOptions`) and a
 * fixed container id, so two units on one page collide; a same-origin `srcdoc` iframe gives each
 * its own window and keeps its CSS out of ours. `onerror` marks a blocked script on the body so the
 * parent can fall through without waiting for the timeout.
 */
export function buildAdsterraSrcdoc(invokeUrl: string): string {
  const src = escapeAttr(invokeUrl);
  const containerId = adsterraContainerId(invokeUrl);
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style>' +
    `</head><body><div id="${containerId}"></div>` +
    `<script async data-cfasync="false" src="${src}" ` +
    `onerror="document.body.setAttribute('data-ad-status','script-failed')"></script>` +
    '</body></html>'
  );
}

export type ContainerFillResult = 'filled' | 'timeout' | 'script-failed';

/** Resolves when `#containerId` gains an element child, the tag reports failure, or the timeout passes. */
export function watchContainerFill(
  doc: Document,
  containerId: string,
  timeoutMs: number,
): Promise<ContainerFillResult> {
  return new Promise((resolve) => {
    const container = doc.getElementById(containerId);
    let observer: MutationObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (result: ContainerFillResult) => {
      observer?.disconnect();
      if (timer) clearTimeout(timer);
      resolve(result);
    };
    const check = () => {
      if (doc.body?.getAttribute('data-ad-status') === 'script-failed') {
        finish('script-failed');
      } else if (container && container.childElementCount > 0) {
        finish('filled');
      }
    };
    timer = setTimeout(() => finish('timeout'), timeoutMs);
    if (typeof MutationObserver !== 'undefined' && doc.body) {
      observer = new MutationObserver(check);
      observer.observe(doc.body, { childList: true, subtree: true, attributes: true });
    }
    check();
  });
}

export function createAdsterraProvider(
  config: WebAdConfig,
  options: { timeoutMs?: number } = {},
): WebAdProvider {
  const { invoke, frameHeight } = config.adsterra;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  function AdsterraSlot({ placement, onFilled, onUnfilled }: NetworkSlotProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const callbacks = useRef({ onFilled, onUnfilled });
    callbacks.current = { onFilled, onUnfilled };
    const invokeUrl = invoke[placement];
    const srcdoc = useMemo(() => (invokeUrl ? buildAdsterraSrcdoc(invokeUrl) : ''), [invokeUrl]);

    useEffect(() => {
      const iframe = iframeRef.current;
      if (!invokeUrl || !iframe) {
        callbacks.current.onUnfilled('not-configured');
        return;
      }
      const containerId = adsterraContainerId(invokeUrl);
      let cancelled = false;

      const onLoad = () => {
        const doc = iframe.contentDocument;
        if (!doc) {
          if (!cancelled) callbacks.current.onUnfilled('script-failed');
          return;
        }
        void watchContainerFill(doc, containerId, timeoutMs).then((result) => {
          if (cancelled) return;
          if (result === 'filled') callbacks.current.onFilled();
          else callbacks.current.onUnfilled(result);
        });
      };

      iframe.addEventListener('load', onLoad);
      return () => {
        cancelled = true;
        iframe.removeEventListener('load', onLoad);
      };
    }, [invokeUrl]);

    if (!invokeUrl) return null;

    return (
      <iframe
        ref={iframeRef}
        title="Advertisement"
        srcDoc={srcdoc}
        scrolling="no"
        style={{ display: 'block', width: '100%', height: frameHeight, border: 0 }}
      />
    );
  }

  return {
    id: 'adsterra',
    supportsNonPersonalized: false,
    isConfigured: (placement) => Boolean(invoke[placement]),
    frameHeight: () => frameHeight,
    load: () => Promise.resolve(typeof window === 'undefined' ? 'blocked' : 'ready'),
    Slot: AdsterraSlot,
    teardown: () => {},
  };
}

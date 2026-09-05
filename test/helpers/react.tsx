import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// The project has no DOM testing library; components are mounted with the real
// react-dom client inside jsdom and driven with `act`.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export interface Mounted {
  container: HTMLDivElement;
  root: Root;
  rerender: (node: ReactNode) => Promise<void>;
  unmount: () => Promise<void>;
}

export async function mount(node: ReactNode): Promise<Mounted> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return {
    container,
    root,
    rerender: async (next) => {
      await act(async () => {
        root.render(next);
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

/** Flush pending effects / microtasks inside act. */
export async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

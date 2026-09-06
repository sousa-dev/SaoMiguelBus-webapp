import type { StateStorage } from 'zustand/middleware';

/**
 * `localStorage` when the page has one, otherwise an in-memory map. Keeps zustand's persist
 * middleware silent during prerendering and node-environment tests, where `localStorage` is
 * not defined and the middleware would otherwise warn on every store creation.
 */
export function webStorage(): StateStorage {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  const memory = new Map<string, string>();
  return {
    getItem: (name) => memory.get(name) ?? null,
    setItem: (name, value) => {
      memory.set(name, value);
    },
    removeItem: (name) => {
      memory.delete(name);
    },
  };
}

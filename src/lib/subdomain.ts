import { SUBDOMAIN_TO_PATH } from '@/lib/seo-config';

const IGNORED_LABELS = new Set(['www', 'app', 'localhost', 'staging', 'dev']);

/**
 * Resolves the in-app module path for the current host when it is served from a
 * module subdomain (e.g. `radares.saomiguelbus.com` → `/traffic`). Returns null
 * for the apex/app host or unknown subdomains.
 */
export function resolveSubdomainPath(host = window.location.hostname): string | null {
  const labels = host.split('.');
  // Need at least sub.domain.tld; ignore bare hosts and IPs.
  if (labels.length < 3 || /^\d+$/.test(labels[labels.length - 1])) {
    return null;
  }
  const first = labels[0].toLowerCase();
  if (IGNORED_LABELS.has(first)) {
    return null;
  }
  return SUBDOMAIN_TO_PATH[first] ?? null;
}

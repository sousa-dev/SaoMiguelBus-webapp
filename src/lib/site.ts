import { SITE } from '@/lib/seo-config';

/** Canonical public base URL of the app (no trailing slash). */
export function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  return (fromEnv && fromEnv.trim()) || SITE.defaultUrl;
}

/** Root domain used to build module subdomains (e.g. `saomiguelbus.com`). */
export function getBaseDomain(): string {
  const fromEnv = import.meta.env.VITE_BASE_DOMAIN as string | undefined;
  return (fromEnv && fromEnv.trim()) || SITE.defaultBaseDomain;
}

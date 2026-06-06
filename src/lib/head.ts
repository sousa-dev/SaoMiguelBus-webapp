/**
 * Tiny dependency-free document <head> manager. Keeps title, meta description,
 * canonical, Open Graph / Twitter tags, the <html lang> attribute and an optional
 * JSON-LD block in sync as the user navigates client-side. Tags are tagged with
 * `data-rh` so we update (never duplicate) them.
 */
import { SITE } from '@/lib/seo-config';
import { getSiteUrl } from '@/lib/site';

export interface HeadMeta {
  title: string;
  description: string;
  /** Absolute or app-relative canonical URL. Defaults to the current location. */
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  locale?: string;
  jsonLd?: Record<string, unknown>;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute('data-rh', 'true');
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function toAbsolute(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${getSiteUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function setHead(meta: HeadMeta): void {
  const canonical = meta.canonical ?? window.location.pathname;
  const canonicalAbs = toAbsolute(canonical);
  const imageAbs = toAbsolute(meta.image ?? SITE.ogImage);
  const localeTag = (meta.locale ?? 'pt').replace('-', '_');

  document.title = meta.title;

  upsertMeta('name', 'description', meta.description);
  upsertLink('canonical', canonicalAbs);

  upsertMeta('property', 'og:site_name', SITE.name);
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:type', meta.type ?? 'website');
  upsertMeta('property', 'og:url', canonicalAbs);
  upsertMeta('property', 'og:image', imageAbs);
  upsertMeta('property', 'og:locale', localeTag === 'en' ? 'en_GB' : 'pt_PT');

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);
  upsertMeta('name', 'twitter:image', imageAbs);

  // JSON-LD structured data (one managed block).
  let ld = document.getElementById('smb-jsonld');
  if (meta.jsonLd) {
    if (!ld) {
      ld = document.createElement('script');
      ld.id = 'smb-jsonld';
      (ld as HTMLScriptElement).type = 'application/ld+json';
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(meta.jsonLd);
  } else if (ld) {
    ld.remove();
  }
}

export function setHtmlLang(lang: string): void {
  document.documentElement.setAttribute('lang', lang.split('-')[0] || 'pt');
}

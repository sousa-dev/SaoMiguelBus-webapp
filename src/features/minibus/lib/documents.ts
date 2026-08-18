import { getApiBase } from '@/lib/api';

const DOCUMENT_SLUG_PATTERN = /^[a-z0-9-]+$/;

export function isValidMinibusDocumentSlug(slug: string): boolean {
  return DOCUMENT_SLUG_PATTERN.test(slug.trim());
}

/**
 * Build the document stream URL from the configured API base.
 *
 * The API's own `file_url` / `timetable_file_url` fields come back as absolute
 * `http://` URLs (the origin server has no TLS), which the browser blocks as
 * mixed content on an https page. Never use them directly — always rebuild from
 * `getApiBase()`, which is the configured (https-in-prod) origin.
 */
export function buildMinibusDocumentFileUrl(slug: string): string {
  const normalized = slug.trim();
  return `${getApiBase()}/api/v3/minibus/documents/${encodeURIComponent(normalized)}/file`;
}

export function isAllowedMinibusDocumentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const base = new URL(getApiBase());
    if (parsed.hostname !== base.hostname) {
      return false;
    }
    return (
      parsed.pathname.startsWith('/api/v3/minibus/documents/') && parsed.pathname.endsWith('/file')
    );
  } catch {
    return false;
  }
}

function documentSlugFromUrl(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/\/api\/v3\/minibus\/documents\/([^/]+)\/file$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** Prefer a known document slug; fall back to the server URL only if it is already ours. */
export function resolveMinibusImageUri(
  remoteUrl?: string | null,
  documentSlug?: string,
): string | null {
  if (documentSlug && isValidMinibusDocumentSlug(documentSlug)) {
    return buildMinibusDocumentFileUrl(documentSlug);
  }
  if (!remoteUrl) {
    return null;
  }
  if (isAllowedMinibusDocumentUrl(remoteUrl)) {
    const slug = documentSlugFromUrl(remoteUrl);
    if (slug) {
      return buildMinibusDocumentFileUrl(slug);
    }
  }
  return remoteUrl;
}

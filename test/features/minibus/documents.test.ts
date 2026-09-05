/**
 * The API's `file_url` / `timetable_file_url` fields come back as absolute
 * `http://` URLs (the origin server has no TLS). Trusting them directly would
 * get every timetable image blocked as mixed content on the https webapp, so
 * these helpers must always rebuild from the configured (https) API base.
 */

import { describe, expect, it } from 'vitest';

import { getApiBase } from '@/lib/api';
import {
  buildMinibusDocumentFileUrl,
  isAllowedMinibusDocumentUrl,
  isValidMinibusDocumentSlug,
  resolveMinibusImageUri,
} from '@/features/minibus/lib/documents';

describe('isValidMinibusDocumentSlug', () => {
  it('accepts lowercase alphanumeric-and-hyphen slugs', () => {
    expect(isValidMinibusDocumentSlug('line-a')).toBe(true);
    expect(isValidMinibusDocumentSlug('network-map')).toBe(true);
  });

  it('rejects uppercase, path traversal and unexpected characters', () => {
    expect(isValidMinibusDocumentSlug('Line-A')).toBe(false);
    expect(isValidMinibusDocumentSlug('../secrets')).toBe(false);
    expect(isValidMinibusDocumentSlug('line-a/../../etc')).toBe(false);
    expect(isValidMinibusDocumentSlug('line a')).toBe(false);
  });
});

describe('buildMinibusDocumentFileUrl', () => {
  it('rewrites to the configured API base, never the server-provided origin', () => {
    const url = buildMinibusDocumentFileUrl('line-a');
    expect(url).toBe(`${getApiBase()}/api/v3/minibus/documents/line-a/file`);
    expect(url.startsWith('http://')).toBe(false);
  });
});

describe('isAllowedMinibusDocumentUrl', () => {
  it('accepts a documents/file URL on the configured API host', () => {
    const url = `${getApiBase()}/api/v3/minibus/documents/line-a/file`;
    expect(isAllowedMinibusDocumentUrl(url)).toBe(true);
  });

  it('rejects a different host or a non-document path', () => {
    expect(isAllowedMinibusDocumentUrl('https://evil.example.com/api/v3/minibus/documents/line-a/file')).toBe(
      false,
    );
    expect(isAllowedMinibusDocumentUrl(`${getApiBase()}/api/v3/minibus/lines`)).toBe(false);
  });
});

describe('resolveMinibusImageUri', () => {
  it('prefers a known document slug over the remote URL', () => {
    expect(resolveMinibusImageUri('http://staging.api.saomiguelbus.com/whatever', 'line-a')).toBe(
      buildMinibusDocumentFileUrl('line-a'),
    );
  });

  it('rewrites an allowed remote URL onto the configured base', () => {
    const remote = 'http://staging.api.saomiguelbus.com/api/v3/minibus/documents/line-b/file';
    expect(resolveMinibusImageUri(remote)).toBe(buildMinibusDocumentFileUrl('line-b'));
  });

  it('returns null when there is nothing to resolve', () => {
    expect(resolveMinibusImageUri(null)).toBeNull();
  });
});

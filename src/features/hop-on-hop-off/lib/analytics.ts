import { track } from '@/lib/analytics';

export type HopOnOffSource = 'hub' | 'transit' | 'minibus';

export function trackHopOnOffSheetOpen(source: HopOnOffSource): void {
  track('hop_on_off', 'sheet_open', { source });
}

/** Only the hostname is recorded — never the full URL/query, which carries the affiliate id. */
export function trackHopOnOffBookClick(source: HopOnOffSource, url: string): void {
  let urlHost: string | undefined;
  try {
    urlHost = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    urlHost = undefined;
  }
  track('hop_on_off', 'book_click', { source, url_host: urlHost });
}

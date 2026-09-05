/**
 * Fare-table presentation rules, ported from the Expo app.
 *
 * The one thing to hold onto: a `band` is a LABEL the operator wrote — "0 a 5",
 * "6 a 7", "8" — never a numeric range to parse or sort. The API gives a fare
 * TABLE, not a per-ride price, and nothing upstream knows how many kilometres a
 * given journey is.
 */

import type { Tariff, TariffCategory, TariffsResponse } from '@/lib/types';

export interface TariffInfoLink {
  text: string;
  url: string;
}

export type TariffsState = 'ready' | 'empty' | 'unavailable';

/**
 * What the prices page should show.
 *
 * A 404 is `empty`, not an error: the endpoint exists but no snapshot has been
 * synced yet, which is exactly what production returns today. (`fetchTariffs`
 * already turns that 404 into `null`.) Showing a failure for "we have not
 * fetched the fares yet" would be wrong.
 */
export function resolveTariffsState(
  data: TariffsResponse | null | undefined,
  error?: unknown,
): TariffsState {
  if (error) {
    const status = (error as { status?: number } | null)?.status;
    return status === 404 ? 'empty' : 'unavailable';
  }
  if (!data || data.categories.length === 0) {
    return 'empty';
  }
  return data.categories.some((category) => category.tariffs.length > 0) ? 'ready' : 'empty';
}

export type TariffRenderer = 'banded' | 'single';

/**
 * What the band labels measure — `"km"` today.
 *
 * The bands are DISTANCES: "0 a 5" is a journey of up to 5 km, not a zone or a
 * ticket count. A table of bare numbers next to prices is unreadable without
 * that, so the unit becomes the column header.
 *
 * Read from the payload rather than assumed: the operator can restructure this,
 * and an unknown unit must still render its own name.
 */
export function fareBandUnit(tariff: Pick<Tariff, 'fareUnitType'>): string | null {
  return tariff.fareUnitType?.trim() || null;
}

/**
 * Two renderers, chosen from the data rather than a hardcoded category list.
 *
 * The two price shapes are distinguished by the PRESENCE of `fareUnitType`, not
 * by how many bands happen to be listed — a distance-banded tariff with a single
 * band is still a distance table.
 */
export function tariffRenderer(tariff: Pick<Tariff, 'prices' | 'fareUnitType'>): TariffRenderer {
  if (fareBandUnit(tariff)) {
    return 'banded';
  }
  return tariff.prices.filter((price) => Boolean(price.band)).length > 1 ? 'banded' : 'single';
}

/**
 * The currency the operator prices in. There is no currency field in the payload
 * — the amounts are bare numbers — and the Azores use the euro, so this is
 * presentation, not a fare.
 */
const TARIFF_CURRENCY = 'EUR';

/**
 * A payload amount, rendered as money.
 *
 * The NUMBER always comes from the payload; only the currency and the local
 * grouping convention are ours. A value that is not a number is passed through
 * verbatim rather than coerced — "sob consulta" stays as written — and a missing
 * price renders as nothing, never as a fabricated amount.
 */
export function formatTariffPrice(
  value: string | number | null | undefined,
  locale: string,
): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const amount = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(amount)) {
    return String(value);
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: TARIFF_CURRENCY,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} €`;
  }
}

/**
 * What a collapsed category holds, so the header is still informative when the
 * section is shut — which is how the page opens.
 */
export function categorySummary(category: Pick<TariffCategory, 'tariffs'>): string {
  return category.tariffs
    .map((tariff) => tariff.name)
    .filter(Boolean)
    .join(' · ');
}

/**
 * The operator's own link-outs.
 *
 * These matter because the bands are labelled as distances: the obvious next
 * question is "how many kilometres is my journey?", and nothing upstream answers
 * it. The honest response is the band table plus the operator's documentation,
 * so it is rendered rather than dropped.
 */
export function tariffInfoLinks(infos: unknown[] | undefined): TariffInfoLink[] {
  if (!Array.isArray(infos)) {
    return [];
  }
  const links: TariffInfoLink[] = [];
  for (const info of infos) {
    if (!info || typeof info !== 'object') {
      continue;
    }
    const { text, url } = info as { text?: unknown; url?: unknown };
    if (typeof url !== 'string' || !url) {
      continue;
    }
    links.push({ text: typeof text === 'string' && text ? text : url, url });
  }
  return links;
}

// @vitest-environment jsdom
//
// jsdom only because Leaflet touches `window` at import time (JourneyCard pulls
// in MapView). The assertions below are all on rendered markup.

/**
 * Render checks for the two rules that are easiest to regress silently, pinned
 * against payloads captured verbatim from the live API:
 *
 *   1. A tight transfer warns about SLACK, not the raw wait. The fixture has
 *      wait 24 / walk 3 / slack 21 precisely so the two cannot be confused — a
 *      card that says "24" has read the wrong field and is telling a rider they
 *      have 3 minutes they do not have.
 *   2. A departure shows its DESTINATION, never its headsign. Upstream's
 *      headsign is a time range ("00:00 » 01:05"), so rendering it puts a
 *      meaningless string where the rider looks for where the bus is going.
 *
 * Rendered with `renderToStaticMarkup` rather than a DOM library: these are
 * assertions about output, and the project has no browser driver.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import i18n from 'i18next';

import { DepartureRow } from '@/features/transit/components/DepartureRow';
import { JourneyCard, TransferRow } from '@/features/transit/components/JourneyCard';
import { ScheduleChangeBanner } from '@/features/transit/components/ScheduleChangeBanner';
import { queryClient } from '@/lib/queryClient';
import type {
  BootstrapResponse,
  TransitJourney,
  TransitStopDetail,
  TransitTransferLeg,
} from '@/lib/types';

// Top-level, NOT in a `beforeAll`: `describe` bodies run during collection,
// before any hook, so a hook here would leave the first render un-translated and
// every assertion would be checking raw i18n keys.
await import('@/lib/i18n');
await i18n.changeLanguage('pt');

function fixture<T>(name: string): T {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'test', 'fixtures', 'azoresbus', name), 'utf8'),
  ) as T;
}

const journey = fixture<{ journey: TransitJourney }>('journey-with-transfer.json').journey;
const stopDetail = fixture<TransitStopDetail>('stop-detail.json');

function render(node: React.ReactNode, client: QueryClient = queryClient): string {
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const transferLeg = journey.legs.find(
  (leg): leg is TransitTransferLeg => leg.kind === 'transfer',
)!;

describe('the transfer fixture is the discriminating one', () => {
  it('has a wait, a walk and a slack that are all different numbers', () => {
    expect(transferLeg.waitMinutes).toBe(24);
    expect(transferLeg.walkMinutes).toBe(3);
    expect(transferLeg.slackMinutes).toBe(21);
    expect(transferLeg.tight).toBe(true);
  });
});

describe('TransferRow', () => {
  const html = render(<TransferRow leg={transferLeg} />);

  it('warns with the SLACK, not the raw wait', () => {
    // "Apenas 21 min para mudar" — the number that decides whether to risk it.
    // A card that says 24 has read the wrong field.
    expect(html).toContain('Apenas 21 min');
    expect(html).not.toContain('Apenas 24 min');
  });

  it('still reports the full wait separately, as a duration in words', () => {
    // The whole gap is 24 minutes; it reads as "24 minutos", never "0,4 horas".
    expect(html).toContain('24 minutos');
  });

  it('says there is a walk, and where from', () => {
    expect(html).toContain('3 min a pé');
    expect(html).toContain('FURNAS (LARGO DO TEATRO)');
  });

  it('renders no raw i18n keys', () => {
    expect(html).not.toMatch(/>(transit|duration|track)[A-Z][A-Za-z]*</);
  });
});

describe('JourneyCard', () => {
  const html = render(<JourneyCard journey={journey} />);

  it('leads with the tight-change warning, quoting slack', () => {
    expect(html).toContain('Apenas 21 min');
  });

  it('names every bus the rider takes', () => {
    expect(html).toContain('318 → 110');
  });

  it('reads the duration as words', () => {
    // 08h48 → 09h57 is 69 minutes: "1 hora e 9 minutos", never "1.15 horas".
    expect(html).toContain('1 hora e 9 minutos');
  });

  it('renders no raw i18n keys', () => {
    expect(html).not.toMatch(/>(transit|duration|premium|pinned)[A-Za-z]*</);
  });

  it('does not mount the map until expanded', () => {
    // Mounting is what FETCHES the geometry; a page of twenty results must not
    // fire forty requests for maps nobody opened.
    expect(html).not.toContain('leaflet');
  });
});

describe('DepartureRow', () => {
  const departure = stopDetail.departures[0];
  const html = render(<DepartureRow departure={departure} />);

  it('shows the destination', () => {
    expect(departure.destination).toBe('STO. ANTÓNIO BAIXO (LG. DA CRUZ)');
    expect(html).toContain('STO. ANTÓNIO BAIXO');
  });

  it('never shows the headsign, which upstream fills with a time range', () => {
    expect(departure.headsign).toMatch(/»/);
    expect(html).not.toContain('»');
  });

  it('links to the trip', () => {
    expect(html).toContain(`/transit/trip/${departure.tripId}`);
  });
});

/** The live staging config: cutover armed, preview offered, phase `preview`. */
const BOOTSTRAP = {
  transitSchedule: {
    activeDataset: 'legacy',
    previewDataset: 'azoresbus',
    cutoverAt: '2026-09-01T00:00:00+00:00',
    nextTransitionAt: '2026-09-01T00:00:00+00:00',
    phase: 'preview',
    banner: {
      id: 'azoresbus-live-2026-09',
      tone: 'info',
      dismissible: false,
      text: { pt: 'Os novos horários da AzoresBus já estão em vigor.' },
      phases: {
        preview: {
          id: 'azoresbus-preview-2026-08',
          dismissible: true,
          text: { pt: 'A rede de autocarros muda a 1 de setembro. Vê já os novos horários.' },
        },
      },
    },
    badge: { text: { pt: 'Válido desde 1 de setembro' } },
    trackingEnabled: false,
  },
} as unknown as BootstrapResponse;

describe('ScheduleChangeBanner against the live staging config', () => {
  function renderWithBootstrap(bootstrap: BootstrapResponse | undefined): string {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    if (bootstrap) {
      client.setQueryData(['bootstrap', 'v3'], bootstrap);
    }
    return render(<ScheduleChangeBanner />, client);
  }

  it('shows the PREVIEW copy, not the live copy, during the preview phase', () => {
    const html = renderWithBootstrap(BOOTSTRAP);
    // The per-phase override has to win, or the app announces a changeover that
    // has not happened.
    expect(html).toContain('muda a 1 de setembro');
    expect(html).not.toContain('já estão em vigor');
  });

  it('offers the preview toggle as one labelled switch', () => {
    const html = renderWithBootstrap(BOOTSTRAP);
    expect(html).toContain('role="switch"');
    expect(html).toContain('Ver os novos horários');
    expect(html).toContain('aria-checked="false"');
  });

  it('renders nothing at all when the server sends no schedule', () => {
    // This is the regression bar: an island with no azoresbus flags must look
    // exactly as it did before any of this existed.
    expect(renderWithBootstrap(undefined)).toBe('');
  });

  it('renders nothing when a schedule exists but no cutover is armed', () => {
    const unconfigured = {
      transitSchedule: {
        ...BOOTSTRAP.transitSchedule,
        cutoverAt: null,
        previewDataset: null,
      },
    } as unknown as BootstrapResponse;
    expect(renderWithBootstrap(unconfigured)).toBe('');
  });
});

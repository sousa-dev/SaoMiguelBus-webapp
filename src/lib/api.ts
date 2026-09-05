import { staticIslandConfig } from '@/config/island';
import { ApiRequestError } from '@/lib/api-errors';
import {
  journeyFromSearchResult,
  shouldFallBackToDirectSearch,
} from '@/features/transit/lib/journey-fallback';
import { getAnalyticsPlatform, getAppVersion } from '@/lib/platform';
import { getOrCreateSessionId } from '@/lib/session';
import type {
  AdPayload,
  BootstrapResponse,
  ConfirmVote,
  ConsentPurposes,
  DirectionsResponse,
  MarketplaceProvider,
  MarketplaceProvidersResult,
  MarketplaceReview,
  MinibusDocument,
  MinibusDocumentsResponse,
  MinibusLine,
  MinibusLinesResponse,
  MinibusMeta,
  MinibusNetworkResponse,
  MinibusRouteSearchResponse,
  MinibusTariffsResponse,
  NewsArticle,
  NewsSource,
  ParishWeather,
  SeismicEvent,
  ServiceCategory,
  Stop,
  TourDetail,
  TourSummary,
  TrafficCategory,
  TrafficReport,
  TrailDetail,
  TrailsListResponse,
  TariffsResponse,
  TransitDataset,
  TransitJourney,
  TransitJourneySearch,
  TransitLegGeometry,
  TransitLineDetail,
  TransitLineShape,
  TransitSearchResult,
  TransitStopDetail,
  TripDetail,
  RouteWeather,
  WeatherParishesResponse,
} from '@/lib/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://staging.api.saomiguelbus.com';

export function getApiBase(): string {
  return API_BASE;
}

export { ApiRequestError } from '@/lib/api-errors';

function baseHeaders(extra?: HeadersInit): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Island': staticIslandConfig.islandKey,
    ...(extra ?? {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: baseHeaders(init?.headers),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new ApiRequestError(response.status, body);
  }
  return (await response.json()) as T;
}

// --- Bootstrap & transit --- //

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  return apiFetch<BootstrapResponse>('/api/v3/bootstrap');
}

/**
 * Every transit read takes an optional dataset, and it is only ever appended
 * when truthy.
 *
 * The client is allowed to send exactly one value — `azoresbus`, while
 * previewing. Omitting the parameter lets the server resolve the network from
 * its own Atlantic/Azores clock, which is the only answer that stays correct
 * across the cutover instant. See `features/transit/lib/schedule-config.ts`.
 */
function withDataset(query: URLSearchParams, dataset?: TransitDataset | null): string {
  if (dataset) {
    query.set('dataset', dataset);
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchStops(dataset?: TransitDataset | null): Promise<Stop[]> {
  const data = await apiFetch<{ stops: Stop[] }>(
    `/api/v3/transit/stops${withDataset(new URLSearchParams(), dataset)}`,
  );
  // Dedupe on NAME, never on id. The server emits every real stop and then a
  // block of short-name aliases that REUSE the same id (194 legacy rows carry
  // 108 distinct ids), so deduping by id silently deletes every alias — and the
  // alias is often the name a rider types.
  const seen = new Set<string>();
  return data.stops.filter((stop) => {
    if (seen.has(stop.name)) {
      return false;
    }
    seen.add(stop.name);
    return true;
  });
}

export async function searchTransit(params: {
  origin: string;
  destination: string;
  day: string;
  start: string;
  dataset?: TransitDataset | null;
}): Promise<TransitSearchResult[]> {
  const { dataset, ...rest } = params;
  const data = await apiFetch<{ results: TransitSearchResult[] }>(
    `/api/v3/transit/search${withDataset(new URLSearchParams(rest), dataset)}`,
  );
  return data.results ?? [];
}

export interface JourneySearchParams {
  origin: string;
  destination: string;
  day: string;
  start: string;
  /** 0 = one bus only. Omitted ⇒ the server's default of 1. */
  maxTransfers?: number;
  dataset?: TransitDataset | null;
}

/**
 * Multi-leg journey search, degrading to direct search when the endpoint is
 * missing or broken (see `shouldFallBackToDirectSearch`).
 */
export async function searchTransitJourneys(
  params: JourneySearchParams,
): Promise<TransitJourneySearch> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    day: params.day,
    start: params.start,
  });
  if (params.maxTransfers != null) {
    query.set('maxTransfers', String(params.maxTransfers));
  }

  try {
    const data = await apiFetch<{
      journeys?: TransitJourney[];
      maxTransfers?: number;
      transfersAvailable?: number;
    }>(`/api/v3/transit/journeys${withDataset(query, params.dataset)}`);
    return {
      journeys: data.journeys ?? [],
      maxTransfers: data.maxTransfers ?? params.maxTransfers ?? 1,
      ...(data.transfersAvailable != null
        ? { transfersAvailable: data.transfersAvailable }
        : {}),
    };
  } catch (error) {
    if (!shouldFallBackToDirectSearch(error)) {
      throw error;
    }
    const results = await searchTransit({
      origin: params.origin,
      destination: params.destination,
      day: params.day,
      start: params.start,
      dataset: params.dataset,
    });
    // The direct endpoint knows nothing about changes, so the answer it gives is
    // a direct-only one — say so rather than implying transfers were considered.
    return { journeys: results.map(journeyFromSearchResult), maxTransfers: 0 };
  }
}

export async function fetchTripDetail(
  tripId: number,
  dataset?: TransitDataset | null,
): Promise<TripDetail> {
  return apiFetch<TripDetail>(
    `/api/v3/transit/trips/${tripId}${withDataset(new URLSearchParams(), dataset)}`,
  );
}

export async function fetchStopDetail(params: {
  stopId: number;
  day: string;
  start: string;
  dataset?: TransitDataset | null;
}): Promise<TransitStopDetail> {
  const query = new URLSearchParams({ day: params.day, start: params.start });
  return apiFetch<TransitStopDetail>(
    `/api/v3/transit/stops/${params.stopId}${withDataset(query, params.dataset)}`,
  );
}

/**
 * The drawable path for one ride leg.
 *
 * `from`/`to` are the leg's `board.sequence` / `alight.sequence`. Omit BOTH to
 * get the whole trip — that is how the trip detail page draws the full line.
 */
export async function fetchTripGeometry(params: {
  tripId: number;
  from?: number;
  to?: number;
  dataset?: TransitDataset | null;
}): Promise<TransitLegGeometry> {
  const query = new URLSearchParams();
  if (params.from != null && params.to != null) {
    query.set('from', String(params.from));
    query.set('to', String(params.to));
  }
  return apiFetch<TransitLegGeometry>(
    `/api/v3/transit/trips/${params.tripId}/geometry${withDataset(query, params.dataset)}`,
  );
}

export async function fetchLineShape(
  code: string,
  dataset?: TransitDataset | null,
): Promise<TransitLineShape> {
  return apiFetch<TransitLineShape>(
    `/api/v3/transit/lines/${encodeURIComponent(code)}/shape${withDataset(
      new URLSearchParams(),
      dataset,
    )}`,
  );
}

export async function fetchLineDetail(
  code: string,
  dataset?: TransitDataset | null,
): Promise<TransitLineDetail> {
  return apiFetch<TransitLineDetail>(
    `/api/v3/transit/lines/${encodeURIComponent(code)}${withDataset(
      new URLSearchParams(),
      dataset,
    )}`,
  );
}

/**
 * Fare tables. Takes no dataset — the tariff snapshot belongs to the operator,
 * not to a timetable.
 *
 * A 404 means "nothing has been synced yet", which is an EMPTY state and not an
 * error, so it resolves to `null` rather than throwing.
 */
export async function fetchTariffs(): Promise<TariffsResponse | null> {
  try {
    return await apiFetch<TariffsResponse>('/api/v3/transit/tariffs');
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function voteTrip(
  tripId: number,
  vote: 'like' | 'dislike' | 'undo_like' | 'undo_dislike' | 'switch_to_like',
  dataset?: TransitDataset | null,
): Promise<TripDetail> {
  return apiFetch<TripDetail>(
    `/api/v3/transit/trips/${tripId}/vote${withDataset(new URLSearchParams(), dataset)}`,
    {
      method: 'POST',
      body: JSON.stringify({ vote }),
    },
  );
}

export async function fetchDirections(params: {
  origin: string;
  destination: string;
  day: string;
  start: string;
  locale?: string;
}): Promise<DirectionsResponse> {
  const sessionId = getOrCreateSessionId();
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    day: params.day,
    start: params.start,
    session_id: sessionId,
    locale: params.locale ?? 'pt',
  });
  return apiFetch<DirectionsResponse>(`/api/v3/transit/directions?${query.toString()}`);
}

// --- Mini Bus (PDL MiniBus, Ponta Delgada urban network) --- //

function minibusQuery(locale?: string): string {
  const query = new URLSearchParams();
  if (locale) {
    query.set('locale', locale);
  }
  const suffix = query.toString();
  return suffix ? `?${suffix}` : '';
}

export async function fetchMinibusLines(params?: { locale?: string }): Promise<MinibusLinesResponse> {
  return apiFetch<MinibusLinesResponse>(`/api/v3/minibus/lines${minibusQuery(params?.locale)}`);
}

export async function fetchMinibusLine(
  slug: string,
  params?: { locale?: string },
): Promise<MinibusLine & MinibusMeta> {
  return apiFetch<MinibusLine & MinibusMeta>(
    `/api/v3/minibus/lines/${encodeURIComponent(slug)}${minibusQuery(params?.locale)}`,
  );
}

export async function fetchMinibusTariffs(params?: { locale?: string }): Promise<MinibusTariffsResponse> {
  return apiFetch<MinibusTariffsResponse>(`/api/v3/minibus/tariffs${minibusQuery(params?.locale)}`);
}

export async function fetchMinibusNetwork(params?: { locale?: string }): Promise<MinibusNetworkResponse> {
  return apiFetch<MinibusNetworkResponse>(`/api/v3/minibus/network${minibusQuery(params?.locale)}`);
}

export async function fetchMinibusDocuments(params?: {
  locale?: string;
}): Promise<MinibusDocumentsResponse> {
  return apiFetch<MinibusDocumentsResponse>(`/api/v3/minibus/documents${minibusQuery(params?.locale)}`);
}

export async function fetchMinibusSchematic(params?: {
  locale?: string;
}): Promise<MinibusDocument & MinibusMeta> {
  return apiFetch<MinibusDocument & MinibusMeta>(
    `/api/v3/minibus/schematic${minibusQuery(params?.locale)}`,
  );
}

export async function fetchMinibusRoute(params: {
  origin: string;
  destination: string;
  locale?: string;
}): Promise<MinibusRouteSearchResponse> {
  const query = new URLSearchParams({ origin: params.origin, destination: params.destination });
  if (params.locale) {
    query.set('locale', params.locale);
  }
  return apiFetch<MinibusRouteSearchResponse>(`/api/v3/minibus/route?${query.toString()}`);
}

// --- News --- //

export async function fetchNewsSources(): Promise<NewsSource[]> {
  const data = await apiFetch<{ sources: NewsSource[] }>('/api/v3/news/sources');
  return data.sources;
}

export async function fetchNewsArticles(params?: {
  category?: string;
  source?: number;
  q?: string;
  limit?: number;
}): Promise<NewsArticle[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.source) query.set('source', String(params.source));
  if (params?.q) query.set('q', params.q);
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const data = await apiFetch<{ articles: NewsArticle[] }>(`/api/v3/news/articles${suffix}`);
  return data.articles;
}

export async function fetchNewsArticle(articleId: number): Promise<NewsArticle> {
  return apiFetch<NewsArticle>(`/api/v3/news/articles/${articleId}`);
}

// --- Tours / events --- //

export async function fetchTours(params?: {
  locale?: string;
  currency?: string;
  limit?: number;
}): Promise<TourSummary[]> {
  const query = new URLSearchParams();
  if (params?.locale) query.set('locale', params.locale);
  if (params?.currency) query.set('currency', params.currency);
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const data = await apiFetch<{ tours: TourSummary[] }>(`/api/v3/events/tours${suffix}`);
  return data.tours;
}

export async function fetchTour(
  code: string,
  params?: { locale?: string; currency?: string },
): Promise<TourDetail> {
  const query = new URLSearchParams();
  if (params?.locale) query.set('locale', params.locale);
  if (params?.currency) query.set('currency', params.currency);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<TourDetail>(`/api/v3/events/tours/${encodeURIComponent(code)}${suffix}`);
}

// --- Weather --- //

export async function fetchWeatherParishes(): Promise<WeatherParishesResponse> {
  return apiFetch<WeatherParishesResponse>('/api/v3/weather/parishes');
}

export async function fetchWeatherParish(slug: string): Promise<ParishWeather> {
  return apiFetch<ParishWeather>(`/api/v3/weather/parishes/${encodeURIComponent(slug)}`);
}

export async function fetchRouteWeather(params: {
  origin: string;
  destination: string;
  originAt?: string;
  destinationAt?: string;
}): Promise<RouteWeather> {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
  });
  if (params.originAt) query.set('origin_at', params.originAt);
  if (params.destinationAt) query.set('destination_at', params.destinationAt);
  return apiFetch<RouteWeather>(`/api/v3/transit/route-weather?${query.toString()}`);
}

// --- Earthquakes --- //

export async function fetchSeismicEvents(params?: {
  minMagnitude?: number;
  sinceHours?: number;
  limit?: number;
}): Promise<SeismicEvent[]> {
  const query = new URLSearchParams();
  if (params?.minMagnitude !== undefined) query.set('min_magnitude', String(params.minMagnitude));
  if (params?.sinceHours !== undefined) query.set('since_hours', String(params.sinceHours));
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const data = await apiFetch<{ events: SeismicEvent[] }>(`/api/v3/seismic/events${suffix}`);
  return data.events;
}

export async function fetchSeismicEvent(eventId: number): Promise<SeismicEvent> {
  return apiFetch<SeismicEvent>(`/api/v3/seismic/events/${eventId}`);
}

export async function postSeismicFelt(
  eventId: number,
  payload: { felt: boolean; intensity?: number | null },
): Promise<SeismicEvent> {
  const sessionId = getOrCreateSessionId();
  return apiFetch<SeismicEvent>(`/api/v3/seismic/events/${eventId}/felt`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, session_id: sessionId }),
  });
}

// --- Trails --- //

export async function fetchTrails(params?: {
  difficulty?: string;
  shape?: string;
  minLength?: number;
  maxLength?: number;
  limit?: number;
}): Promise<TrailsListResponse> {
  const query = new URLSearchParams();
  if (params?.difficulty) query.set('difficulty', params.difficulty);
  if (params?.shape) query.set('shape', params.shape);
  if (params?.minLength != null) query.set('min_length', String(params.minLength));
  if (params?.maxLength != null) query.set('max_length', String(params.maxLength));
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<TrailsListResponse>(`/api/v3/trails/${suffix}`);
}

export async function fetchTrail(trailId: number): Promise<TrailDetail> {
  return apiFetch<TrailDetail>(`/api/v3/trails/${trailId}`);
}

// --- Marketplace --- //

export async function fetchMarketplaceCategories(): Promise<ServiceCategory[]> {
  const data = await apiFetch<{ categories: ServiceCategory[] }>('/api/v3/marketplace/categories');
  return data.categories;
}

export async function fetchProviders(params?: {
  category?: string;
  q?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  min_rating?: number;
  has_rate?: boolean;
  verified?: boolean;
  sort?: string;
  limit?: number;
}): Promise<MarketplaceProvidersResult> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.q) query.set('q', params.q);
  if (params?.lat != null && params?.lng != null) {
    query.set('lat', String(params.lat));
    query.set('lng', String(params.lng));
  }
  if (params?.radius_km != null) query.set('radius_km', String(params.radius_km));
  if (params?.min_rating != null) query.set('min_rating', String(params.min_rating));
  if (params?.has_rate) query.set('has_rate', 'true');
  if (params?.verified) query.set('verified', 'true');
  if (params?.sort) query.set('sort', params.sort);
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<MarketplaceProvidersResult>(`/api/v3/marketplace/providers${suffix}`);
}

export async function fetchProvider(providerId: number): Promise<MarketplaceProvider> {
  const sessionId = getOrCreateSessionId();
  return apiFetch<MarketplaceProvider>(`/api/v3/marketplace/providers/${providerId}`, {
    headers: { 'X-Session-Id': sessionId },
  });
}

export async function fetchReviews(providerId: number): Promise<MarketplaceReview[]> {
  const data = await apiFetch<{ reviews: MarketplaceReview[] }>(
    `/api/v3/marketplace/providers/${providerId}/reviews`,
  );
  return data.reviews;
}

export async function submitReview(
  providerId: number,
  payload: { rating: number; text?: string },
): Promise<MarketplaceReview> {
  const sessionId = getOrCreateSessionId();
  return apiFetch<MarketplaceReview>(`/api/v3/marketplace/providers/${providerId}/reviews`, {
    method: 'POST',
    headers: { 'X-Session-Id': sessionId },
    body: JSON.stringify({ ...payload, session_id: sessionId }),
  });
}

// --- Traffic --- //

export async function fetchTrafficCategories(): Promise<TrafficCategory[]> {
  const data = await apiFetch<{ categories: TrafficCategory[] }>('/api/v3/traffic/categories');
  return data.categories;
}

export async function fetchTrafficReports(params?: {
  category?: string;
  includeScheduled?: boolean;
  limit?: number;
}): Promise<TrafficReport[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.includeScheduled) query.set('include_scheduled', 'true');
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const data = await apiFetch<{ reports: TrafficReport[] }>(`/api/v3/traffic/reports${suffix}`);
  return data.reports;
}

export async function fetchTrafficReport(reportId: number): Promise<TrafficReport> {
  const sessionId = getOrCreateSessionId();
  return apiFetch<TrafficReport>(`/api/v3/traffic/reports/${reportId}`, {
    headers: { 'X-Session-Id': sessionId },
  });
}

export async function confirmTrafficReport(
  reportId: number,
  vote: ConfirmVote,
): Promise<TrafficReport> {
  const sessionId = getOrCreateSessionId();
  return apiFetch<TrafficReport>(`/api/v3/traffic/reports/${reportId}/confirm`, {
    method: 'POST',
    headers: { 'X-Session-Id': sessionId },
    body: JSON.stringify({ session_id: sessionId, vote }),
  });
}

// --- First-party ads (compat /api/v1/ad) --- //

export async function fetchAd(params: { on: string; platform: string }): Promise<AdPayload | null> {
  const query = new URLSearchParams({ on: params.on, platform: params.platform });
  try {
    const response = await fetch(`${API_BASE}/api/v1/ad?${query.toString()}`, {
      headers: baseHeaders(),
    });
    if (!response.ok) return null;
    return (await response.json()) as AdPayload;
  } catch {
    return null;
  }
}

export async function recordAdClick(id: number): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/v1/ad/click?id=${encodeURIComponent(String(id))}`, {
      method: 'POST',
      headers: baseHeaders(),
    });
  } catch {
    /* fire and forget */
  }
}

export async function verifySubscriptionEmail(email: string): Promise<{
  hasActiveSubscription: boolean;
  expiresAt?: string;
}> {
  return apiFetch('/api/v1/subscription/verify/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// --- Consent & analytics --- //

export async function postConsent(sessionId: string, purposes: ConsentPurposes) {
  return apiFetch('/api/v3/consent/', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, purposes }),
  });
}

export async function postAnalyticsEvents(
  sessionId: string,
  events: {
    module: string;
    event_type: string;
    properties?: Record<string, unknown>;
    occurred_at?: string;
  }[],
) {
  return apiFetch<{ accepted: number; dropped: number }>('/api/v3/analytics/events', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      platform: getAnalyticsPlatform(),
      app_version: getAppVersion(),
      events,
    }),
  });
}

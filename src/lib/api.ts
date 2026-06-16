import { staticIslandConfig } from '@/config/island';
import { getOrCreateSessionId } from '@/lib/session';
import type {
  AdPayload,
  BootstrapResponse,
  ConfirmVote,
  DirectionsResponse,
  MarketplaceProvider,
  MarketplaceReview,
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
  TransitSearchResult,
  TripDetail,
  WeatherParishesResponse,
} from '@/lib/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://staging.api.saomiguelbus.com';

export function getApiBase(): string {
  return API_BASE;
}

/** Structured error mirroring the Expo client's ApiRequestError. */
export class ApiRequestError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

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

export async function fetchStops(): Promise<Stop[]> {
  const data = await apiFetch<{ stops: Stop[] }>('/api/v3/transit/stops');
  const seen = new Set<number>();
  return data.stops.filter((stop) => {
    if (seen.has(stop.id)) {
      return false;
    }
    seen.add(stop.id);
    return true;
  });
}

export async function searchTransit(params: {
  origin: string;
  destination: string;
  day: string;
  start: string;
}): Promise<TransitSearchResult[]> {
  const query = new URLSearchParams(params);
  const data = await apiFetch<{ results: TransitSearchResult[] }>(
    `/api/v3/transit/search?${query.toString()}`,
  );
  return data.results ?? [];
}

export async function fetchTripDetail(tripId: number): Promise<TripDetail> {
  return apiFetch<TripDetail>(`/api/v3/transit/trips/${tripId}`);
}

export async function voteTrip(
  tripId: number,
  vote: 'like' | 'dislike' | 'undo_like' | 'undo_dislike' | 'switch_to_like',
): Promise<TripDetail> {
  return apiFetch<TripDetail>(`/api/v3/transit/trips/${tripId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ vote }),
  });
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
  limit?: number;
}): Promise<MarketplaceProvider[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.q) query.set('q', params.q);
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const data = await apiFetch<{ providers: MarketplaceProvider[] }>(
    `/api/v3/marketplace/providers${suffix}`,
  );
  return data.providers;
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

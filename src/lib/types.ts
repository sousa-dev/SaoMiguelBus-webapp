/** API data contracts — ported verbatim from the Expo app (lib/types.ts). */

export interface BootstrapResponse {
  island: {
    key: string;
    name: string;
    defaultLocale: string;
    locales: string[];
    theme: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    };
    mapCenter: { lat: number; lng: number };
    enabledModules: string[];
  };
  version: string;
  mapsEnabled: boolean;
  consentPolicyVersion: string;
  holidays: { id: number; date: string; name: string }[];
  infos: Record<string, unknown>[];
}

export interface Stop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface TripStop {
  name: string;
  time: string;
  sequence?: number;
}

export interface TransitSearchResult {
  id: number;
  route: string;
  origin: string;
  destination: string;
  start: string;
  end: string;
  typeOfDay?: string;
  likesPercent: number;
  dislikesPercent: number;
  information: Record<string, unknown>;
  stops: TripStop[];
}

export interface TripDetail {
  id: number;
  route: string;
  typeOfDay?: string;
  likes: number;
  dislikes: number;
  information: Record<string, unknown>;
  stops: TripStop[];
  likesPercent?: number;
  dislikesPercent?: number;
}

export interface DirectionsTimeValue {
  value?: number;
  text?: string;
}

export interface DirectionsStep {
  travel_mode: string;
  html_instructions?: string;
  duration?: { value: number; text: string };
  distance?: { value: number; text: string };
  polyline?: { points?: string };
  transit_details?: {
    line?: { short_name?: string; name?: string; color?: string; vehicle?: { type?: string } };
    departure_stop?: { name?: string };
    arrival_stop?: { name?: string };
    departure_time?: DirectionsTimeValue;
    arrival_time?: DirectionsTimeValue;
  };
}

export interface DirectionsLeg {
  duration?: { value: number; text: string };
  distance?: { value: number; text: string };
  departure_time?: DirectionsTimeValue;
  arrival_time?: DirectionsTimeValue;
  start_address?: string;
  end_address?: string;
  steps?: DirectionsStep[];
}

export interface DirectionsRoute {
  summary?: string;
  legs?: DirectionsLeg[];
  overview_polyline?: { points?: string };
}

export interface DirectionsResponse {
  routes?: DirectionsRoute[];
  warning?: string;
  error?: { code?: string; message?: string } | string;
}

export interface NewsSource {
  id: number;
  name: string;
  language: string;
  kind: string;
  defaultCategory: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
  category: string;
  source: {
    id: number;
    name: string;
    language: string;
  };
}

export interface TourSummary {
  code: string;
  title: string;
  thumbnailUrl: string;
  rating: number | null;
  reviewCount: number | null;
  fromPrice: number | null;
  currency: string;
  durationMinutes: number | null;
  bookingUrl: string;
}

export interface TourImage {
  url: string;
  caption: string;
}

export interface TourDetail extends TourSummary {
  heroUrl: string;
  description: string;
  images: TourImage[];
  flags: string[];
}

export interface SeismicNearestIsland {
  key: string;
  name: string;
  distanceKm: number;
  bearing: string;
}

export interface SeismicEvent {
  id: number;
  emscId: string;
  magnitude: number;
  depthKm: number | null;
  latitude: number;
  longitude: number;
  occurredAt: string;
  region: string;
  nearestIsland?: SeismicNearestIsland | null;
  feltCount?: number;
  feltYesCount?: number;
  feltNoCount?: number;
  feltSummary?: Record<string, number>;
}

export interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  userSuggested?: boolean;
  isActive?: boolean;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface MarketplaceProvider {
  id: number;
  name: string;
  category: { id: number; name: string; slug: string };
  bio: string;
  hourlyRate: number | null;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  socials?: SocialLink[];
  latitude: number | null;
  longitude: number | null;
  isPromoted: boolean;
  verifiedByOwner?: boolean;
  rating: number;
  reviewCount: number;
  status?: string;
}

export interface MarketplaceListMeta {
  reviewedShare: number;
  reviewedCount: number;
  totalCount: number;
}

export interface MarketplaceProvidersResult {
  providers: MarketplaceProvider[];
  meta: MarketplaceListMeta;
}

export interface MarketplaceReview {
  id: number;
  providerId: number;
  rating: number;
  text: string;
  createdAt: string;
  status: string;
}

export interface TrafficCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  defaultTtlMinutes: number;
  isSchedulable: boolean;
  order: number;
}

export type TrafficReportStatus = 'active' | 'scheduled' | 'expired' | 'removed';

export interface TrafficReport {
  id: number;
  status: TrafficReportStatus;
  category: { id: number; name: string; slug: string; icon: string };
  latitude: number;
  longitude: number;
  description: string;
  road: string;
  confidence: { confirm: number; deny: number };
  activeFrom: string | null;
  activeUntil: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export type ConfirmVote = 'still_there' | 'gone';

export interface TrailSummary {
  id: number;
  sourceRef?: string;
  name: string;
  difficulty: string;
  distanceKm: number | null;
  shape?: string;
  durationMin?: number | null;
  mapImageUrl?: string;
}

export interface TrailWaypoint {
  name: string;
  lat: number;
  lng: number;
}

export interface TrailNearestStop {
  name: string;
  distanceKm: number;
  lat: number;
  lng: number;
}

export interface TrailDetail extends TrailSummary {
  descriptionPt?: string;
  descriptionEn?: string;
  gpxUrl?: string;
  kmlUrl?: string;
  leafletUrl?: string;
  startLat?: number | null;
  startLng?: number | null;
  waypoints?: TrailWaypoint[];
  nearestStop?: TrailNearestStop | null;
  attribution: string;
}

export interface TrailsListResponse {
  trails: TrailSummary[];
  attribution: string;
}

export interface WeatherCurrent {
  temperature: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  humidity: number | null;
  precipitation: number | null;
  time: string | null;
}

export interface WeatherDaily {
  date: string;
  weatherCode: number | null;
  tempMax: number | null;
  tempMin: number | null;
  precipitationProbabilityMax: number | null;
}

export interface ParishWeather {
  slug: string;
  name: string;
  concelho: string;
  latitude: number;
  longitude: number;
  current: WeatherCurrent;
  daily: WeatherDaily[];
  attribution: string;
}

export interface WeatherParishesResponse {
  parishes: ParishWeather[];
  attribution: string;
}

export interface AdPayload {
  id: number;
  entity: string;
  description: string;
  media: string;
  start: string | null;
  end: string | null;
  action: string | null;
  target: string | null;
  advertise_on?: string;
  platform?: string;
}

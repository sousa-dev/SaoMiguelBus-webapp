import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  fetchMinibusDocuments,
  fetchMinibusLine,
  fetchMinibusLines,
  fetchMinibusNetwork,
  fetchMinibusRoute,
  fetchMinibusSchematic,
  fetchMinibusTariffs,
} from '@/lib/api';
import { track } from '@/lib/analytics';
import type {
  MinibusDocumentsResponse,
  MinibusJourney,
  MinibusLine,
  MinibusLinesResponse,
  MinibusMeta,
  MinibusNetworkResponse,
  MinibusRouteSearchResponse,
  MinibusTariffsResponse,
} from '@/lib/types';

import { setPendingDirections } from './lib/directions-store';
import { resolveMinibusApiLocale } from './lib/locale';
import { networkStopNames } from './lib/stops';

/** The Mini Bus catalog is authored pt/en only; every query key carries this so a UI-language switch refetches instead of serving the wrong content. */
export function useMinibusLocale(): 'pt' | 'en' {
  const { i18n } = useTranslation();
  return resolveMinibusApiLocale(i18n.language);
}

export function useMinibusLines() {
  const locale = useMinibusLocale();
  return useQuery<MinibusLinesResponse>({
    queryKey: ['minibus', 'lines', locale],
    queryFn: () => fetchMinibusLines({ locale }),
  });
}

export function useMinibusLine(slug: string | undefined) {
  const locale = useMinibusLocale();
  return useQuery<MinibusLine & MinibusMeta>({
    queryKey: ['minibus', 'line', slug, locale],
    queryFn: () => fetchMinibusLine(slug as string, { locale }),
    enabled: Boolean(slug),
  });
}

export function useMinibusTariffs() {
  const locale = useMinibusLocale();
  return useQuery<MinibusTariffsResponse>({
    queryKey: ['minibus', 'tariffs', locale],
    queryFn: () => fetchMinibusTariffs({ locale }),
  });
}

export function useMinibusNetwork() {
  const locale = useMinibusLocale();
  return useQuery<MinibusNetworkResponse>({
    queryKey: ['minibus', 'network', locale],
    queryFn: () => fetchMinibusNetwork({ locale }),
    // The network graph is what every line map and the route planner are built
    // from — worth a longer stale time than the default.
    staleTime: 5 * 60 * 1000,
  });
}

export function useMinibusDocuments() {
  const locale = useMinibusLocale();
  return useQuery<MinibusDocumentsResponse>({
    queryKey: ['minibus', 'documents', locale],
    queryFn: () => fetchMinibusDocuments({ locale }),
  });
}

export function useMinibusSchematic() {
  const locale = useMinibusLocale();
  return useQuery({
    queryKey: ['minibus', 'schematic', locale],
    queryFn: () => fetchMinibusSchematic({ locale }),
  });
}

export function useMinibusRoute(origin: string, destination: string, enabled: boolean) {
  const locale = useMinibusLocale();
  return useQuery<MinibusRouteSearchResponse>({
    queryKey: ['minibus', 'route', origin, destination, locale],
    queryFn: () => fetchMinibusRoute({ origin, destination, locale }),
    enabled: enabled && Boolean(origin) && Boolean(destination),
  });
}

/**
 * The origin/destination planner + results, shared by the MiniBus hub (inline,
 * matching mobile) and the standalone `/minibus/search` page.
 */
export function useMinibusRouteSearch(analyticsScreen: string) {
  const navigate = useNavigate();
  const linesQuery = useMinibusLines();
  const networkQuery = useMinibusNetwork();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [submitted, setSubmitted] = useState<{ origin: string; destination: string } | null>(null);

  const stops = useMemo(() => networkStopNames(networkQuery.data), [networkQuery.data]);
  const linesByCode = useMemo(
    () => new Map((linesQuery.data?.lines ?? []).map((line) => [line.code, line])),
    [linesQuery.data],
  );

  const routeQuery = useMinibusRoute(submitted?.origin ?? '', submitted?.destination ?? '', Boolean(submitted));

  useEffect(() => {
    track('minibus', 'view', { screen: analyticsScreen });
    // Fired once per mount, intentionally — `analyticsScreen` is a static prop, not reactive state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!submitted || routeQuery.isFetching) return;
    track('minibus', 'search', {
      origin: submitted.origin,
      destination: submitted.destination,
      results_count: routeQuery.data?.journeys.length ?? 0,
    });
  }, [submitted, routeQuery.isFetching, routeQuery.data]);

  const onSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const onSearch = () => {
    const trimmedOrigin = origin.trim();
    const trimmedDestination = destination.trim();
    if (!trimmedOrigin || !trimmedDestination) return;
    setSubmitted({ origin: trimmedOrigin, destination: trimmedDestination });
  };

  const onViewDirections = (journey: MinibusJourney) => {
    setPendingDirections(journey);
    navigate('/minibus/directions');
  };

  const journeys = routeQuery.data?.journeys ?? [];
  const hasSearched = Boolean(submitted);
  const showEmpty = hasSearched && !routeQuery.isFetching && journeys.length === 0;

  return {
    origin,
    setOrigin,
    destination,
    setDestination,
    stops,
    linesByCode,
    onSwap,
    onSearch,
    onViewDirections,
    journeys,
    isFetching: routeQuery.isFetching,
    hasSearched,
    showEmpty,
  };
}

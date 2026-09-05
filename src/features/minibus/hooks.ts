import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  fetchMinibusDocuments,
  fetchMinibusLine,
  fetchMinibusLines,
  fetchMinibusNetwork,
  fetchMinibusRoute,
  fetchMinibusSchematic,
  fetchMinibusTariffs,
} from '@/lib/api';
import type {
  MinibusDocumentsResponse,
  MinibusLine,
  MinibusLinesResponse,
  MinibusMeta,
  MinibusNetworkResponse,
  MinibusRouteSearchResponse,
  MinibusTariffsResponse,
} from '@/lib/types';

import { resolveMinibusApiLocale } from './lib/locale';

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

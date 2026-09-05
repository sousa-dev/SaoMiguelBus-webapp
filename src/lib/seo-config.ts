/**
 * Central SEO + subdomain configuration.
 *
 * IMPORTANT: this module is imported BOTH by the React app (runtime, with the `@`
 * alias) AND by the Vite build plugin (Node, via a relative path). Keep it as
 * pure data with no React / i18n / `@/...` imports so both contexts can load it.
 */

export type Locale = 'pt' | 'en';

export interface LocalizedText {
  pt: string;
  en: string;
}

export interface ModuleSeo {
  /** Bootstrap module key (gates visibility). */
  key: string;
  /** Canonical in-app route. */
  path: string;
  /**
   * Friendly subdomain label, e.g. `radares` → radares.<baseDomain>. Omit for a
   * sub-page that doesn't deserve its own host (it still gets a prerendered page
   * and a sitemap entry under the main domain).
   */
  subdomain?: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface MinibusLineSeo {
  /** In-app route segment (`/minibus/<slug>`) and API line slug. */
  slug: string;
  /** Line code as printed on vehicles and signage (`A`–`D`). */
  code: string;
  /** Brand color from the operator's catalog. */
  color: string;
  name: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}

export const SITE = {
  name: 'São Miguel Bus',
  /** Falls back to this when VITE_SITE_URL is unset. */
  defaultUrl: 'https://app.saomiguelbus.com',
  /** Root domain used to build module subdomains. */
  defaultBaseDomain: 'saomiguelbus.com',
  ogImage: '/logo.png',
  twitter: '@saomiguelbus',
  themeColor: '#218732',
  tagline: {
    pt: 'O teu guia de São Miguel: horários de autocarro, meteorologia, notícias, trilhos e mais.',
    en: 'Your São Miguel companion: bus schedules, weather, news, trails and more.',
  } satisfies LocalizedText,
} as const;

/** Home page metadata (path `/`). */
export const HOME_SEO = {
  title: {
    pt: 'São Miguel Bus — Horários, Meteorologia e Guia dos Açores',
    en: 'São Miguel Bus — Schedules, Weather & Azores Guide',
  } satisfies LocalizedText,
  description: SITE.tagline,
};

/**
 * Ordered list of modules. `subdomain` enables `radares.saomiguelbus.com` style
 * shortcuts (resolved client-side and via nginx rewrites).
 */
export const MODULE_SEO: ModuleSeo[] = [
  {
    key: 'transit',
    path: '/transit',
    subdomain: 'autocarros',
    title: {
      pt: 'Horários de Autocarro em São Miguel — Pesquisa de Rotas',
      en: 'São Miguel Bus Schedules — Route Search',
    },
    description: {
      pt: 'Pesquisa horários e rotas de autocarro entre qualquer paragem em São Miguel, Açores.',
      en: 'Search bus schedules and routes between any stop in São Miguel, Azores.',
    },
  },
  {
    key: 'transit',
    path: '/transit/network',
    subdomain: 'rede',
    title: {
      pt: 'Mapa da Rede de Autocarros de São Miguel',
      en: 'São Miguel Bus Network Map',
    },
    description: {
      pt: 'Explora todas as paragens da rede de autocarros de São Miguel no mapa.',
      en: 'Browse every stop on the São Miguel bus network on the map.',
    },
  },
  {
    key: 'transit',
    path: '/transit/prices',
    subdomain: 'tarifarios',
    title: {
      pt: 'Tarifários dos Autocarros de São Miguel — Preços por Distância',
      en: 'São Miguel Bus Fares — Prices by Distance',
    },
    description: {
      pt: 'Consulta os tarifários e escalões de preço dos autocarros de São Miguel, Açores.',
      en: 'Check bus fare tables and distance bands for São Miguel, Azores.',
    },
  },
  {
    key: 'minibus',
    path: '/minibus',
    subdomain: 'minibus',
    title: {
      pt: 'Horários do Mini Bus de Ponta Delgada — Linhas A, B, C e D',
      en: 'Ponta Delgada Mini Bus Timetables — Lines A, B, C and D',
    },
    description: {
      pt: 'Horários, paragens e tarifários do Mini Bus, a rede urbana municipal de Ponta Delgada.',
      en: 'Timetables, stops and fares for the Mini Bus, Ponta Delgada’s municipal urban network.',
    },
  },
  {
    key: 'minibus',
    path: '/minibus/search',
    subdomain: 'minibus-rotas',
    title: {
      pt: 'Planear Rota no Mini Bus de Ponta Delgada',
      en: 'Plan a Route on the Ponta Delgada Mini Bus',
    },
    description: {
      pt: 'Encontra que linhas do Mini Bus apanhar entre duas paragens em Ponta Delgada.',
      en: 'Find which Mini Bus lines to take between two stops in Ponta Delgada.',
    },
  },
  {
    key: 'minibus',
    path: '/minibus/schematic',
    title: {
      pt: 'Esquema de Linhas do Mini Bus de Ponta Delgada',
      en: 'Ponta Delgada Mini Bus Line Schematic',
    },
    description: {
      pt: 'Esquema com todas as linhas e paragens do Mini Bus de Ponta Delgada.',
      en: 'A schematic of every Mini Bus line and stop in Ponta Delgada.',
    },
  },
  {
    key: 'news',
    path: '/news',
    subdomain: 'noticias',
    title: {
      pt: 'Notícias dos Açores — São Miguel',
      en: 'Azores News — São Miguel',
    },
    description: {
      pt: 'Últimas notícias e avisos oficiais da ilha de São Miguel, Açores.',
      en: 'Latest news and official notices from São Miguel island, Azores.',
    },
  },
  {
    key: 'weather',
    path: '/weather',
    subdomain: 'meteorologia',
    title: {
      pt: 'Meteorologia em São Miguel — Previsão por Freguesia',
      en: 'São Miguel Weather — Forecast by Parish',
    },
    description: {
      pt: 'Previsão do tempo por freguesia em São Miguel: temperatura, vento e chuva.',
      en: 'Parish-level weather forecast for São Miguel: temperature, wind and rain.',
    },
  },
  {
    key: 'seismic',
    path: '/earthquakes',
    subdomain: 'sismos',
    title: {
      pt: 'Sismos nos Açores — Atividade Sísmica em São Miguel',
      en: 'Azores Earthquakes — Seismic Activity in São Miguel',
    },
    description: {
      pt: 'Atividade sísmica recente nos Açores e perto de São Miguel, com mapa em tempo real.',
      en: 'Recent seismic activity in the Azores and near São Miguel, with a live map.',
    },
  },
  {
    key: 'trails',
    path: '/trails',
    subdomain: 'trilhos',
    title: {
      pt: 'Trilhos de São Miguel — Percursos Pedestres nos Açores',
      en: 'São Miguel Trails — Hiking in the Azores',
    },
    description: {
      pt: 'Descobre os trilhos pedestres oficiais de São Miguel: dificuldade, distância e mapas.',
      en: 'Discover the official hiking trails of São Miguel: difficulty, distance and maps.',
    },
  },
  {
    key: 'events',
    path: '/tours',
    subdomain: 'experiencias',
    title: {
      pt: 'Experiências e Tours em São Miguel, Açores',
      en: 'Experiences & Tours in São Miguel, Azores',
    },
    description: {
      pt: 'Reserva experiências inesquecíveis em São Miguel: observação de baleias, trilhos e mais.',
      en: 'Book unforgettable experiences in São Miguel: whale watching, hikes and more.',
    },
  },
  {
    key: 'traffic',
    path: '/traffic',
    subdomain: 'radares',
    title: {
      pt: 'Radares e Trânsito em São Miguel — Alertas da Comunidade',
      en: 'Radars & Traffic in São Miguel — Community Alerts',
    },
    description: {
      pt: 'Radares, acidentes e perigos na estrada reportados pela comunidade em São Miguel.',
      en: 'Community-reported radars, accidents and road hazards across São Miguel.',
    },
  },
  {
    key: 'marketplace',
    path: '/marketplace',
    subdomain: 'servicos',
    title: {
      pt: 'Serviços Locais em São Miguel — Diretório de Profissionais',
      en: 'Local Services in São Miguel — Provider Directory',
    },
    description: {
      pt: 'Encontra profissionais e serviços locais de confiança em São Miguel, Açores.',
      en: 'Find trusted local professionals and services in São Miguel, Azores.',
    },
  },
];

/**
 * Mini Bus lines are a fixed municipal set (A–D) that has not changed since the
 * network launched. Held here rather than fetched at build time so the Docker
 * build never depends on the API being reachable.
 */
export const MINIBUS_LINE_SEO: MinibusLineSeo[] = [
  {
    slug: 'line-a',
    code: 'A',
    color: '#fbc707',
    name: { pt: 'Linha A — Amarela', en: 'Line A — Yellow' },
    title: {
      pt: 'Linha A — Amarela: Horário e Paragens · Mini Bus Ponta Delgada',
      en: 'Line A — Yellow: Timetable and Stops · Ponta Delgada Mini Bus',
    },
    description: {
      pt: 'Horário, paragens e mapa da Linha A (Amarela) do Mini Bus de Ponta Delgada.',
      en: 'Timetable, stops and map for Line A (Yellow) of the Ponta Delgada Mini Bus.',
    },
  },
  {
    slug: 'line-b',
    code: 'B',
    color: '#99d420',
    name: { pt: 'Linha B — Verde', en: 'Line B — Green' },
    title: {
      pt: 'Linha B — Verde: Horário e Paragens · Mini Bus Ponta Delgada',
      en: 'Line B — Green: Timetable and Stops · Ponta Delgada Mini Bus',
    },
    description: {
      pt: 'Horário, paragens e mapa da Linha B (Verde) do Mini Bus de Ponta Delgada.',
      en: 'Timetable, stops and map for Line B (Green) of the Ponta Delgada Mini Bus.',
    },
  },
  {
    slug: 'line-c',
    code: 'C',
    color: '#00adef',
    name: { pt: 'Linha C — Azul', en: 'Line C — Blue' },
    title: {
      pt: 'Linha C — Azul: Horário e Paragens · Mini Bus Ponta Delgada',
      en: 'Line C — Blue: Timetable and Stops · Ponta Delgada Mini Bus',
    },
    description: {
      pt: 'Horário, paragens e mapa da Linha C (Azul) do Mini Bus de Ponta Delgada.',
      en: 'Timetable, stops and map for Line C (Blue) of the Ponta Delgada Mini Bus.',
    },
  },
  {
    slug: 'line-d',
    code: 'D',
    color: '#f47216',
    name: { pt: 'Linha D — Laranja', en: 'Line D — Orange' },
    title: {
      pt: 'Linha D — Laranja: Horário e Paragens · Mini Bus Ponta Delgada',
      en: 'Line D — Orange: Timetable and Stops · Ponta Delgada Mini Bus',
    },
    description: {
      pt: 'Horário, paragens e mapa da Linha D (Laranja) do Mini Bus de Ponta Delgada.',
      en: 'Timetable, stops and map for Line D (Orange) of the Ponta Delgada Mini Bus.',
    },
  },
];

/** path → ModuleSeo. */
export const MODULE_SEO_BY_PATH: Record<string, ModuleSeo> = Object.fromEntries(
  MODULE_SEO.map((m) => [m.path, m]),
);

/** slug → MinibusLineSeo. */
export const MINIBUS_LINE_SEO_BY_SLUG: Record<string, MinibusLineSeo> = Object.fromEntries(
  MINIBUS_LINE_SEO.map((l) => [l.slug, l]),
);

/** subdomain label → in-app path (e.g. `radares` → `/traffic`). Skips module pages with no subdomain. */
export const SUBDOMAIN_TO_PATH: Record<string, string> = Object.fromEntries(
  MODULE_SEO.filter((m) => m.subdomain).map((m) => [m.subdomain as string, m.path]),
);

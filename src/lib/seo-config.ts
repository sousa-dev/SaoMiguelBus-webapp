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
  /** Friendly subdomain label, e.g. `radares` → radares.<baseDomain>. */
  subdomain: string;
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

/** path → ModuleSeo. */
export const MODULE_SEO_BY_PATH: Record<string, ModuleSeo> = Object.fromEntries(
  MODULE_SEO.map((m) => [m.path, m]),
);

/** subdomain label → in-app path (e.g. `radares` → `/traffic`). */
export const SUBDOMAIN_TO_PATH: Record<string, string> = Object.fromEntries(
  MODULE_SEO.map((m) => [m.subdomain, m.path]),
);

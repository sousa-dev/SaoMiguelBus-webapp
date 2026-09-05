import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { setHead, setHtmlLang, type HeadMeta } from '@/lib/head';
import { HOME_SEO, MODULE_SEO_BY_PATH, SITE, type Locale } from '@/lib/seo-config';

interface SeoProps {
  /** When set, pulls localized title/description from the module SEO config. */
  modulePath?: string;
  /** Explicit overrides (used by detail pages with dynamic content). */
  title?: string;
  description?: string;
  /** Treat `home` specially (no " · São Miguel Bus" suffix). */
  home?: boolean;
  type?: HeadMeta['type'];
  image?: string;
  jsonLd?: Record<string, unknown>;
}

function withSiteName(title: string): string {
  return title.includes(SITE.name) ? title : `${title} · ${SITE.name}`;
}

/** Declaratively manages the document head for the current page. */
export function Seo({ modulePath, title, description, home, type, image, jsonLd }: SeoProps) {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.split('-')[0] as Locale) === 'en' ? 'en' : 'pt';

  let resolvedTitle = title ?? '';
  let resolvedDescription = description ?? SITE.tagline[lang];

  if (home) {
    resolvedTitle = HOME_SEO.title[lang];
    resolvedDescription = HOME_SEO.description[lang];
  } else if (modulePath && MODULE_SEO_BY_PATH[modulePath]) {
    const mod = MODULE_SEO_BY_PATH[modulePath];
    resolvedTitle = mod.title[lang];
    resolvedDescription = mod.description[lang];
  }

  const finalTitle = home ? resolvedTitle : withSiteName(resolvedTitle || SITE.name);

  useEffect(() => {
    setHtmlLang(lang);
    setHead({
      title: finalTitle,
      description: resolvedDescription,
      type,
      image,
      locale: lang,
      jsonLd,
    });
  }, [finalTitle, resolvedDescription, type, image, lang, jsonLd]);

  return null;
}

import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

import { HOME_SEO, MINIBUS_LINE_SEO, MODULE_SEO, SITE } from './src/lib/seo-config';

interface SeoOptions {
  siteUrl: string;
  baseDomain: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function withSiteName(title: string): string {
  return title.includes(SITE.name) ? title : `${title} · ${SITE.name}`;
}

function headBlock(opts: {
  title: string;
  description: string;
  url: string;
  image: string;
  type: 'website' | 'article';
  /** A single schema, or several — the latter are wrapped in a `@graph`. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}): string {
  const lines = [
    `<meta name="description" content="${esc(opts.description)}" />`,
    `<link rel="canonical" href="${opts.url}" />`,
    `<meta property="og:site_name" content="${esc(SITE.name)}" />`,
    `<meta property="og:title" content="${esc(opts.title)}" />`,
    `<meta property="og:description" content="${esc(opts.description)}" />`,
    `<meta property="og:type" content="${opts.type}" />`,
    `<meta property="og:url" content="${opts.url}" />`,
    `<meta property="og:image" content="${opts.image}" />`,
    `<meta property="og:locale" content="pt_PT" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(opts.title)}" />`,
    `<meta name="twitter:description" content="${esc(opts.description)}" />`,
    `<meta name="twitter:image" content="${opts.image}" />`,
  ];
  if (opts.jsonLd) {
    const jsonLd = Array.isArray(opts.jsonLd)
      ? { '@context': 'https://schema.org', '@graph': opts.jsonLd }
      : opts.jsonLd;
    lines.push(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`);
  }
  return lines.join('\n    ');
}

function renderPage(template: string, opts: Parameters<typeof headBlock>[0]): string {
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(opts.title)}</title>`)
    .replace('<!-- SEO_HEAD -->', headBlock(opts));
}

/**
 * Generates a static, SEO-friendly HTML file per module route so crawlers and
 * social scrapers (that may not execute JS) get correct titles, descriptions,
 * canonical URLs and Open Graph tags. Also writes sitemap.xml and robots.txt.
 */
export function seoPrerender(opts: SeoOptions): Plugin {
  let outDir = 'dist';
  const siteUrl = opts.siteUrl.replace(/\/$/, '');
  const image = `${siteUrl}${SITE.ogImage}`;

  return {
    name: 'smb-seo-prerender',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const root = path.resolve(outDir);
      const indexPath = path.join(root, 'index.html');
      if (!fs.existsSync(indexPath)) return;
      const template = fs.readFileSync(indexPath, 'utf8');

      // Home (root index.html).
      const homeJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE.name,
        url: `${siteUrl}/`,
        inLanguage: 'pt',
      };
      fs.writeFileSync(
        indexPath,
        renderPage(template, {
          title: HOME_SEO.title.pt,
          description: HOME_SEO.description.pt,
          url: `${siteUrl}/`,
          image,
          type: 'website',
          jsonLd: homeJsonLd,
        }),
      );

      // Per-module prerendered pages → dist/<path>/index.html.
      for (const mod of MODULE_SEO) {
        const dir = path.join(root, mod.path.replace(/^\//, ''));
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'index.html'),
          renderPage(template, {
            title: withSiteName(mod.title.pt),
            description: mod.description.pt,
            url: `${siteUrl}${mod.path}`,
            image,
            type: 'website',
            // The Mini Bus hub links every line so crawlers can reach the line
            // pages even before client-side JS runs.
            jsonLd:
              mod.path === '/minibus'
                ? {
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    itemListElement: MINIBUS_LINE_SEO.map((line, index) => ({
                      '@type': 'ListItem',
                      position: index + 1,
                      name: line.name.pt,
                      url: `${siteUrl}/minibus/${line.slug}`,
                    })),
                  }
                : undefined,
          }),
        );
      }

      // Per-Mini-Bus-line prerendered pages → dist/minibus/<slug>/index.html.
      // These are the pages a search for "horário linha A mini bus" should land
      // on — the generic module page above is one level too shallow for that.
      for (const line of MINIBUS_LINE_SEO) {
        const lineUrl = `${siteUrl}/minibus/${line.slug}`;
        const dir = path.join(root, 'minibus', line.slug);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'index.html'),
          renderPage(template, {
            title: line.title.pt,
            description: line.description.pt,
            url: lineUrl,
            image,
            type: 'website',
            jsonLd: [
              {
                '@type': 'BusTrip',
                name: line.name.pt,
                busName: line.name.pt,
                busNumber: line.code,
                provider: {
                  '@type': 'Organization',
                  name: 'PDL MiniBus',
                  url: 'https://pdlminibus.pt',
                },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: SITE.name, item: `${siteUrl}/` },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'PDL MiniBus',
                    item: `${siteUrl}/minibus`,
                  },
                  { '@type': 'ListItem', position: 3, name: line.name.pt, item: lineUrl },
                ],
              },
            ],
          }),
        );
      }

      // sitemap.xml — main module paths, Mini Bus line pages + friendly subdomain roots.
      const today = new Date().toISOString().slice(0, 10);
      const urls = [
        `${siteUrl}/`,
        ...MODULE_SEO.map((m) => `${siteUrl}${m.path}`),
        ...MINIBUS_LINE_SEO.map((l) => `${siteUrl}/minibus/${l.slug}`),
      ];
      for (const mod of MODULE_SEO) {
        if (mod.subdomain) {
          urls.push(`https://${mod.subdomain}.${opts.baseDomain}/`);
        }
      }
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq></url>`,
  )
  .join('\n')}
</urlset>
`;
      fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);

      // robots.txt
      fs.writeFileSync(
        path.join(root, 'robots.txt'),
        `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      );
    },
  };
}

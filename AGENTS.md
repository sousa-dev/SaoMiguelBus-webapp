# AGENTS.md

## Cursor Cloud specific instructions

### Overview

São Miguel Bus / São Miguel Hub webapp. The repository root is now the **revamp web app**:
a React + Vite + TypeScript single-page app (Tailwind CSS v4) that talks to the `/api/v3`
backend. The previous vanilla-JS PWA has been moved to `legacy/` (deprecated, kept for
reference only).

| Area | Path |
|------|------|
| New web app (deployed) | repository root (`src/`, `public/`, `index.html`, `vite.config.ts`, …) |
| Legacy PWA (deprecated) | `legacy/` |

### Running the web app

```bash
cd /agent/repos/SaoMiguelBus-webapp
npm install
npm run dev        # http://localhost:3000
```

### Build & lint

```bash
npm run build      # tsc + vite build + SEO prerender → dist/
npm run lint       # eslint
```

### Configuration (`.env`, see `.env.example`)

| Env var | Purpose |
|---------|---------|
| `VITE_API_URL` | v3 API base (default staging until the prod DNS cutover) |
| `VITE_ISLAND_KEY` | tenant key sent as the `X-Island` header |
| `VITE_SITE_URL` / `VITE_BASE_DOMAIN` | canonical URL + module-subdomain root (SEO) |
| `VITE_ANDROID_APP_URL` / `VITE_IOS_APP_URL` / `VITE_IOS_APP_ID` | native app install promotion |
| `VITE_WEB_AD_PROVIDERS`, `VITE_ADSTERRA_NATIVE_*`, `VITE_ADSENSE_*` | display-ad waterfall (see README “Display ads”) |
| `VITE_REVENUECAT_WEB_KEY` / `VITE_REVENUECAT_WEB_SANDBOX_KEY` / `VITE_REVENUECAT_ENTITLEMENT_ID` | RevenueCat Web Billing (see README “Accounts & premium”) |

### Deployment (Docker / Dokploy)

Multi-stage `Dockerfile` at the repo root: stage 1 (Node 22) runs `npm ci && npm run build`,
stage 2 (nginx) serves `dist/` with SPA fallback + module-subdomain rewrites (`nginx.conf`).
`.dockerignore` excludes `legacy/`, `node_modules` and `dist`.

```bash
docker build -t smb-webapp --build-arg VITE_API_URL=https://api.saomiguelbus.com .
docker run -p 8080:80 smb-webapp
```

### Architecture notes

- Feature modules live in `src/features/<module>/`; shared UI in `src/components/`; helpers and
  config in `src/lib/`.
- SEO/subdomain config is centralized in `src/lib/seo-config.ts` (used by the app and by
  `vite-plugin-seo.ts`, which prerenders per-module HTML + `sitemap.xml` + `robots.txt`).
- Maps use `react-leaflet` with OpenStreetMap tiles (`src/components/MapView.tsx`).

### AI / agent discoverability

So that AI assistants (ChatGPT, Claude, Perplexity, …) find and use the public transit API
instead of guessing, this app ships static, dependency-free pages the SPA router never sees
(nginx serves them as real files before the `try_files … /index.html` fallback — see
`nginx.conf` and `src/App.tsx`'s `*` catch-all):

- `public/llms.txt` — short instructions for this domain. Keep in sync by hand with the API
  repo's `agent_docs/docs/ai-quickstart.md` and `https://api.saomiguelhub.com/llms.txt`
  whenever an endpoint shape or URL changes.
- `public/ai/index.html` — human/agent-readable quick start at `/ai`, linked from the sidebar
  footer (`AppShell.tsx`, i18n key `developersAndAi`).
- `public/mcp/index.html` — static setup page for the live MCP server at
  `https://api.saomiguelhub.com/mcp`; keep its snippets aligned with the API repo.
- Shared AI endpoint/path constants live in `AI_DISCOVERY` in `src/lib/seo-config.ts`, used by
  `vite-plugin-seo.ts` for head `<link rel="alternate">` tags, the home page's `WebAPI` JSON-LD
  node and `sitemap.xml`/`robots.txt` generation. The `public/` files above are copied as-is
  (no build step), so their URLs must be kept in sync with `AI_DISCOVERY` by hand.

### Legacy PWA (`legacy/`)

Static vanilla-JS PWA (no build step). Only touch it for historical reference.

```bash
cd legacy
npx browser-sync start --server --port 3001 --no-open --files "*, js/" --no-inject-changes
node check_locale_keys.js   # reports missing i18n keys per locale
```

- Legacy API base URL lives in `legacy/js/config.js`.
- `legacy/desktop/` is the old desktop-optimized variant.

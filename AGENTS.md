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

### Legacy PWA (`legacy/`)

Static vanilla-JS PWA (no build step). Only touch it for historical reference.

```bash
cd legacy
npx browser-sync start --server --port 3001 --no-open --files "*, js/" --no-inject-changes
node check_locale_keys.js   # reports missing i18n keys per locale
```

- Legacy API base URL lives in `legacy/js/config.js`.
- `legacy/desktop/` is the old desktop-optimized variant.

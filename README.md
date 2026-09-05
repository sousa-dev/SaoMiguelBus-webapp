# São Miguel Bus — Desktop Web App

A desktop-focused React web application for **São Miguel Bus / São Miguel Hub**, intended to be
served at `app.<host>`. It is a faithful web port of the Expo (React Native) app in the
[`SaoMiguelBus`](https://github.com/sousa-dev/SaoMiguelBus) repository and talks to the same
`/api/v3` backend ([`SaoMiguelBus-api`](https://github.com/sousa-dev/SaoMiguelBus-api)).

## Tech stack

| Concern | Choice | Mirrors mobile |
|---|---|---|
| Framework | React 19 + Vite + TypeScript | — |
| Styling | Tailwind CSS v4 | design tokens ported from `lib/theme.tsx` / `lib/tokens.ts` |
| Data fetching | `@tanstack/react-query` | same query keys + 30 min stale / 24 h gc |
| State | `zustand` (persisted) | recent searches / favorites |
| i18n | `i18next` + `react-i18next` | locale JSON copied from the mobile app |
| Routing | `react-router-dom` | maps Expo Router tabs → routes |
| Maps | `react-leaflet` + OSM/CARTO tiles | matches the mobile Leaflet/OSM stack |
| Icons | `lucide-react` | same icon set as `lucide-react-native` |

## Features (parity with the mobile `revamp` app)

Home dashboard, Transit search + step-by-step Directions + trip details, News, Weather,
Earthquakes (list + map), Trails, Tours/Experiences, Traffic and the Services Marketplace.
Modules are shown/hidden based on `bootstrap.island.enabledModules` from the API.

## Develop

```bash
cp .env.example .env   # optional — defaults to the staging API
npm install
npm run dev            # http://localhost:3000
```

## Build & lint

```bash
npm run build          # tsc + vite build → dist/
npm run lint
```

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `https://staging.api.saomiguelbus.com` | v3 API base. Switch to `https://api.saomiguelbus.com` after the production DNS cutover. |
| `VITE_ISLAND_KEY` | `sao-miguel` | tenant key sent as the `X-Island` header |
| `VITE_SITE_URL` | `https://app.saomiguelbus.com` | canonical base URL (canonical links + sitemap) |
| `VITE_BASE_DOMAIN` | `saomiguelbus.com` | root domain used to build module subdomains |
| `VITE_ANDROID_APP_URL` | _(empty)_ | Google Play URL for the install banner/buttons |
| `VITE_IOS_APP_URL` | `https://apps.apple.com/pt/app/s%C3%A3o-miguel-bus/id6777066837` | App Store URL for the install banner/buttons |
| `VITE_IOS_APP_ID` | `6777066837` | numeric iOS app id for the Smart App Banner |
| `VITE_WEB_AD_PROVIDERS` | _(empty → house creatives only)_ | ordered network waterfall for display ads: `adsense`, `adsterra`, `mock`, `none` (comma separated). Production: `adsterra` now, `adsense,adsterra` after the AdSense site review. |
| `VITE_ADSENSE_CLIENT` | `ca-pub-8246676797736648` | AdSense publisher id (same account as AdMob) |
| `VITE_ADSENSE_SLOT_TOP` / `_INLINE` / `_SIDEBAR` / `_FOOTER` | _(empty)_ | AdSense manual ad-unit ids per placement; sidebar/footer fall back to inline |
| `VITE_ADSENSE_TEST` | `on` in dev, `off` in prod | force `data-adtest="on"` (test creatives, no earnings) |
| `VITE_ADSTERRA_NATIVE_TOP` / `_INLINE` / `_SIDEBAR` / `_FOOTER` | _(empty)_ | Adsterra Native Banner `invoke.js` URL per placement |
| `VITE_ADSTERRA_FRAME_HEIGHT` | `120` | height in px reserved for an Adsterra native unit |
| `VITE_WEB_AD_MOCK_RESULT` | `filled` | dev only: `unfilled` makes the `mock` provider fall through to the house creative |

## Display ads

Every banner slot runs a waterfall (`src/features/ads/`): a **first-party campaign** from
`GET /api/v1/ad` → the **network providers** listed in `VITE_WEB_AD_PROVIDERS`, in order → the
**house creative** (paywall / module promo). The provider abstraction lives in
`src/features/ads/providers/` (`WebAdProvider`: `adsense`, `adsterra`, `mock`, `none`).

- **Consent.** No network script is injected until the consent banner is decided and the *Ads*
  purpose is on. *Personalization* off runs AdSense with `requestNonPersonalizedAds=1`; Adsterra
  has no non-personalized mode and is skipped. Premium users never load an ad script.
- **Layout.** `NetworkAdSlot` measures its column once, reserves a fixed height
  (728×90 / 468×60 / 320×100, or the Adsterra frame height) and shows a skeleton, so a fill, an
  unfilled fallback or an ad blocker never shifts content. Inline slots wait until they are near
  the viewport (`IntersectionObserver`).
- **Unfilled.** AdSense marks `<ins data-ad-status="unfilled">`; Adsterra units render in a
  same-origin `srcdoc` iframe and count as unfilled when the container stays empty. A failed
  script load blocks that provider for the session, so ad-blocker users see the house creative.
- **Placement policy.** Network units only appear on module pages with loaded, non-empty content
  (`isNetworkAdAllowedOnPath` + the `content` prop), never on the consent, legal, not-found,
  loading or empty states. No network interstitials.
- **Analytics.** `transit` / `ad_network_request`, `ad_network_filled`, `ad_network_unfilled`,
  `ad_network_click` with `provider`, `on`, `slot`, `placement` (see `reports/overview`).
- **ads.txt.** `public/ads.txt` is served at `/ads.txt`; AdSense reads the root domain, so
  `https://saomiguelhub.com/ads.txt` (landing-page repo) must carry the same lines.

Local check: `VITE_WEB_AD_PROVIDERS=mock npm run dev` renders placeholder creatives in every
slot; `VITE_WEB_AD_MOCK_RESULT=unfilled` shows the house fallback inside the reserved frame.
Plan and human checklist: `docs/plans/2026-09-05-002-web-display-ads-plan.md`.

## Deep links, subdomains & SEO

- **Deep links**: every module has its own clean URL (`/transit`, `/news`, `/weather`, `/earthquakes`, `/trails`, `/tours`, `/traffic`, `/marketplace`) — directly shareable and bookmarkable.
- **Module subdomains**: friendly subdomains map to modules (`radares` → `/traffic`, `meteorologia` → `/weather`, `sismos` → `/earthquakes`, `trilhos` → `/trails`, `experiencias` → `/tours`, `noticias` → `/news`, `servicos` → `/marketplace`, `autocarros` → `/transit`). Point the DNS at this app; the client resolves the subdomain (`src/lib/subdomain.ts`) and `nginx.conf` serves the matching prerendered page at the subdomain root for crawlers.
- **SEO**: per-route `<title>`/description/canonical/Open Graph/Twitter/JSON-LD are managed at runtime (`src/components/Seo.tsx`) and **prerendered to static HTML at build** (`vite-plugin-seo.ts`) into `dist/<module>/index.html`, so crawlers and social scrapers get correct metadata without running JS. The build also emits `sitemap.xml` (module paths + subdomain roots) and `robots.txt`.
- To change SEO copy or add a module subdomain, edit `src/lib/seo-config.ts` (single source of truth, used by both the app and the build plugin).

## Native app install promotion

- On phones a prominent, dismissible bottom banner promotes the native app, with **platform-specific** store buttons (App Store on iOS, Google Play on Android) — `src/components/AppInstall.tsx`, platform detection in `src/lib/platform.ts`.
- On desktop a subtle "Get the app" card with both store buttons sits in the sidebar footer.
- The iOS App Store listing is live and configured by default. Set `VITE_ANDROID_APP_URL` once Google Play is available; unconfigured store buttons show a "coming soon" state and link to the public hub site. All links resolve through `src/lib/app-links.ts`.

> The production `api.saomiguelbus.com` host still served the legacy backend at the time of
> writing (v3 lives on staging). The default points at staging so the app works out of the box;
> the Docker image defaults `VITE_API_URL` to the production host for the eventual cutover.

## Deploy (Docker / Dokploy)

A multi-stage `Dockerfile` lives at the **repository root** (`../Dockerfile`): stage 1 builds the
Vite bundle on Node, stage 2 serves `dist/` with nginx (SPA fallback via `nginx.conf`).

```bash
# from the repository root
docker build -t smb-webapp --build-arg VITE_API_URL=https://api.saomiguelbus.com .
docker run -p 8080:80 smb-webapp
```

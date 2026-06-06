# São Miguel Bus — Desktop Web App

A desktop-focused React web application for **São Miguel Bus / Azores Hub**, intended to be
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

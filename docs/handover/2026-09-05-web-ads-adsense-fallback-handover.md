# Handover: add display ads to SaoMiguelBus-webapp (AdSense by default, researched fallback first)

You are picking up work in the `SaoMiguelBus-webapp` repository (React 19 + Vite + TypeScript + Tailwind v4 + react-router 7 + zustand + TanStack Query, deployed as Docker/nginx via Dokploy at `https://app.saomiguelhub.com`, with module subdomains like `radares.saomiguelhub.com`). Read `AGENTS.md` and `README.md` first. Use your normal workflow: explore, brainstorm/plan, write a plan doc in `docs/plans/` (copy the frontmatter style of the existing plan there), then implement test-first. Do not touch `legacy/` except to read it.

## Goal

Monetize the web app with third-party display ads. Google AdSense is the intended default, but AdSense approval is uncertain (single-page app, app-like, thin crawlable text, new domain). So:

1. Research and pick a fallback ad network that will accept the site now, and ship it first.
2. Build a provider abstraction so each ad slot can serve AdSense or the fallback based on config, with the existing house creatives as the final fallback.
3. Prepare everything AdSense needs for approval (ads.txt, consent, privacy policy, crawlable content) so switching the default to AdSense is a config change once approved. Keep the fallback as backfill for unfilled AdSense slots afterwards.

## Why this matters (production analytics, 30 days to 2026-09-05, consented users only)

- Web is 42% of all route searches across web, Android and iOS: 35,464 searches, 8,676 app loads.
- Web served 66,628 house creatives and earned nothing: 59,550 banner-slot impressions, 5,264 interstitials, 1,815 session app-open modals. House banner clicks: 396.
- Banner impressions by slot: `top` 6,754, `inline-1` 5,944, `inline-3` 5,778, `inline-5` 4,995, `inline-7` 4,698, `inline-11` 3,928, `inline-9` 3,772, `inline-13` 2,780, `inline-15` 2,336, then a long tail down to `inline-21`. Deep inline slots are mostly below the fold, so lazy-load them.
- On the mobile apps the top-of-results slot has roughly 1% click rate against about 0.15% for inline slots. Treat `top` as the premium placement.
- Usage peaks 10h to 13h local, weekdays above weekends. The 1 September timetable change roughly tripled traffic for three days; the next changeover is a known date, so ship before it.
- The Android and iOS apps use AdMob under publisher `pub-8246676797736648`. The legacy PWA in `legacy/` used AdSense Auto Ads with that same publisher (script tag `adsbygoogle.js?client=ca-pub-8246676797736648`, no manual units) and `legacy/ads.txt` lists Google plus `nuwara.io` and a set of resellers, which suggests a second network was used before. Check whether that account still exists before choosing a fallback.

You can pull fresh numbers from the API reporting endpoints (AUTH_KEY protected, key lives in `SaoMiguelBus-api/src/SaoMiguelBus/.env`, never paste it into docs or commits): `GET https://api.saomiguelhub.com/api/v3/analytics/reports/overview?platform=web&event_type=internal_ad_impression`, `.../reports/properties?module=transit&event_type=internal_ad_impression&platform=web`, `.../reports/meta`. Header `X-Auth-Key`.

## Existing ad architecture in this repo (reuse it)

- `src/features/ads/hooks/useAd.ts`: waterfall per slot, first-party campaign (`GET /api/v1/ad?on=&platform=`) then internal house creative. `resolveAdSlotKind` in `src/features/ads/lib/ad-slot.ts` returns `'first-party' | 'internal' | null`. All first-party `Ad` rows in production are inactive, so this always resolves to `internal` today. Keep first-party first: it is the direct-sold tier and the API already records impressions and clicks for it.
- `src/features/ads/components/AdBanner.tsx` renders `FirstPartyAdBanner` or `InternalAdBanner` (a full-width `min-h-14` rounded button with an "Ad" badge). House creatives come from `src/features/ads/lib/internal-ads/catalog.ts` and `select-creative.ts` (paywall and module promos, weighted, sticky per slot).
- Slot call sites: `src/features/transit/TransitPage.tsx` renders `<AdBanner on="home" slot="top" />` under the search form and one inline `AdBanner` after every second journey card (`slot="inline-{index}"`, odd indexes). No other page has ad slots yet.
- Full-screen: `src/features/ads/components/InterstitialOrchestrator.tsx` runs after each completed search (policy in `lib/interstitial-policy.ts`: guaranteed on the first search of a session, then 15%, 30-minute cooldown after a dismissal), waterfall first-party modal, then house fullscreen, then `PremiumUpsellModal`. `SessionAdOrchestrator.tsx` in `src/components/layout/AppShell.tsx` shows one house fullscreen per browser session on `/hub` or `/transit` after an in-app navigation (`lib/app-open-policy.ts`, 2-minute gap).
- Premium suppression: `useCanShowAds()` in `src/features/premium/usePremium.ts` (email cookie verified against the API). Slots render nothing while premium status is loading. Never load an ad script for premium users.
- Consent: `src/components/consent/ConsentBanner.tsx` and `src/lib/consent-store.ts` (purposes `strictly_necessary`, `analytics`, `ads`, `personalization`, all optional purposes default off, persisted under `azores_hub_consent`, synced to `/api/v3/consent`). There is no IAB TCF CMP. `track()` in `src/lib/analytics.ts` only sends events when analytics consent is on.
- Analytics event names for ads today: `transit` / `internal_ad_impression`, `internal_ad_click`, `ad_impression`, `ad_click`, `interstitial_upsell_click`, with props `on`, `slot`, `surface`, `creativeId`. The parity checklist is `src/lib/analytics-parity.ts`.
- SEO: `vite-plugin-seo.ts` prerenders per-module HTML plus `sitemap.xml` and `robots.txt` into `dist/` at build time, so any ad code must be inert during the build (guard on `typeof window`). `public/` has no `ads.txt`. `nginx.conf` serves `dist/` with SPA fallback and redirects `/privacy.html` and `/terms.html` to `https://saomiguelhub.com/...`. There is no Content-Security-Policy header today.
- Routes: `/`, `/hub`, `/transit`, `/transit/directions`, `/transit/line/:code`, `/transit/network`, `/transit/prices`, `/transit/stop/:stopId`, `/transit/trip/:tripId`, `/minibus`, `/minibus/:slug`, `/minibus/schematic`, `/minibus/search`, `/news`, `/news/:articleId`, `/weather`, `/weather/:slug`, `/earthquakes`, `/earthquakes/:id`, `/trails`, `/trails/:id`, `/tours`, `/tours/:code`, `/traffic`, `/traffic/:id`, `/marketplace`, `/marketplace/:id`, `/privacy.html`, `/terms.html`, `*`.

## Phase 0: research the fallback network (do this first, report before implementing)

Use web search and the networks' own documentation. Evaluate at least six candidates and produce a comparison table plus a recommendation with reasoning. Criteria, in priority order:

1. Accepts a new, low-to-mid traffic Portuguese site without an AdSense approval prerequisite and without a traffic minimum, and how fast approval is.
2. GDPR: supports the IAB TCF consent string or a non-personalized mode, and works when the `ads` purpose is rejected. Note what each network requires from a consent banner.
3. Formats: display banners and native or in-feed units only. Reject anything that relies on popunders, push notifications, redirects, interstitial overlays on page load, or auto-injected units you cannot control. This is a transit app; the reviews already punished aggressive ads.
4. Integration in an SPA: a JS tag that can render into slots created after route changes, how it signals unfilled slots, and whether it can co-exist with AdSense on the same page under AdSense policy.
5. Payout: threshold, methods available in Portugal, currency, and payment terms.
6. Reputation: malvertising history, publisher reviews, and how demand looks for EU and specifically Portuguese traffic.

Candidates to start from, not an exhaustive list: Ezoic (their no-minimum entry program), Media.net, Journey by Mediavine, Monumetric, Adsterra, Monetag or PropellerAds (expect to reject on formats), A-ADS (cookie-free, may not need consent), Infolinks, Sovrn, Setupad, Publift, Google Ad Manager (only viable after AdSense approval), and the `nuwara.io` account implied by `legacy/ads.txt`. Also treat the direct-sold tier as a real fallback: the API already has an `Ad` model with a Django admin and an "Anuncie Aqui" creative history, so a house creative that sells the slot to local businesses is the zero-approval option and should stay in the waterfall.

Deliver the research as a section of the plan doc. If the recommended network needs an account the human must create, list the exact steps and the IDs you will need back (publisher ID, zone or unit IDs) as environment variables. Then implement with placeholder IDs and a mock, so the code ships without waiting for the account.

## Phase 1: provider abstraction, consent gating, waterfall

Requirements:

- R1. Add `src/features/ads/providers/` with a small `WebAdProvider` interface: `id`, `load(consent)` that injects the network script at most once and only after the consent decision, a slot component that takes the existing `on` and `slot` plus a `placement` (`top`, `inline`, `sidebar`, `footer`), an `onFilled` / `onUnfilled` signal, and `teardown()`. Implement `adsense` and the chosen fallback, plus a `none` provider for tests and local dev.
- R2. Provider selection from env, read once at startup: `VITE_WEB_AD_PROVIDERS` as an ordered waterfall, for example `fallback,house` now and `adsense,fallback,house` after approval. Per-provider IDs in env (`VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT_TOP`, `VITE_ADSENSE_SLOT_INLINE`, and the fallback's equivalents). Document them in `README.md` and `.env.example`.
- R3. Waterfall per slot: first-party campaign, then the network providers in order, then the house creative. AdSense marks unfilled units with `data-ad-status="unfilled"` on the `<ins>` element; use that to advance. Treat a blocked or failed script load as unfilled so ad blockers still see the house creative.
- R4. Consent: do not load any network script before `decided`. If the `ads` purpose is off, run the provider in its non-personalized mode where one exists, otherwise skip that provider. Research what AdSense requires for EEA traffic (a Google-certified CMP for personalized ads) and recommend whether to integrate Google's own Privacy and Messaging CMP or a certified third party; keep the existing banner for analytics and personalization purposes. Document the decision.
- R5. Layout: reserve height per breakpoint so slots do not shift content (`top` and `inline` are inside the results column, currently 56px tall for house creatives; network units will be taller, so define fixed heights or aspect ratios and use a skeleton). Lazy-load inline slots with an `IntersectionObserver` so `inline-11` and beyond only request when near the viewport. Load the script once and reuse it across route changes.
- R6. Placement policy: no network ads on the consent, privacy, terms, `*` not-found, empty-result or loading states, or anywhere without publisher content. Keep the "Ad" label. Do not wrap network units in your own click handlers. Add the new placements to at least `/hub`, `/weather`, `/news`, `/earthquakes`, `/traffic`, `/trails`, `/tours`, `/transit/stop/:stopId` and `/transit/line/:code`, each with one top slot, using the same provider abstraction. Do not add network interstitials in v1; the house interstitial and session modal stay as they are.
- R7. `public/ads.txt` for `app.saomiguelhub.com` and a note that AdSense reads `ads.txt` at the root domain, so `https://saomiguelhub.com/ads.txt` must also carry the lines. Find where the root domain is hosted and list what the human must place there.
- R8. Analytics: emit `transit` / `ad_network_request`, `ad_network_filled`, `ad_network_unfilled`, and `ad_network_click` where the provider exposes it, with props `provider`, `on`, `slot`, `placement`. Add them to `src/lib/analytics-parity.ts`. This is how fill rate will be measured in `reports/overview`.
- R9. Tests with vitest: provider selection from env, no script before consent, non-personalized mode when `ads` is off, waterfall advancing on unfilled and on script failure, lazy-load gating, and premium suppression. `npm run lint`, `npm test` and `npm run build` must pass, and the prerender must still produce the module pages without executing ad code.

## Phase 2: AdSense readiness (parallel, mostly human steps you must list precisely)

- Which AdSense "site" to add: AdSense manages sites at the root domain, so confirm whether `saomiguelhub.com` is already in the account (the legacy site was probably `saomiguelbus.com`). List the verification method and where the meta tag or `ads.txt` must go.
- Privacy policy at `https://saomiguelhub.com/privacy.html` must disclose third-party ad vendors and cookies. Draft the paragraph.
- Content sufficiency: recommend which pages should be prerendered with real text (line, stop and timetable pages are the best candidates) so the reviewer and the crawler see content, and flag it as a follow-up if out of scope.
- Implement AdSense manual units, not Auto Ads, so placements stay controlled. Support `data-adtest="on"` in non-production builds.
- Write a switch-over checklist: once approved, set `VITE_WEB_AD_PROVIDERS=adsense,fallback,house`, redeploy, verify `ads.txt`, verify consent mode.

## Definition of done

- Fallback network live behind env, house creatives as final fallback, no ad script before consent, premium users see nothing.
- AdSense provider implemented and tested in test mode, switchable by env.
- `ads.txt`, README env table, `.env.example`, and the plan doc with the research table and the human checklist.
- Analytics events flowing so fill rate per slot can be read from the API reports.
- A PR against `main` from a feature branch with a description that includes how to verify: run `npm run dev`, set the env, confirm network test creatives render in `top` and `inline` slots, reject the `ads` purpose and confirm the non-personalized path, block the script and confirm the house creative appears, run Lighthouse and confirm no layout shift.

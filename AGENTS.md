# AGENTS.md

## Cursor Cloud specific instructions

### Overview

São Miguel Bus WebApp — static PWA (vanilla JS, Tailwind via CDN) serving bus schedules. No build step required.

### Running the webapp

```bash
cd /agent/repos/SaoMiguelBus-webapp
npx browser-sync start --server --port 3000 --no-open --files "*, js/" --no-inject-changes
```

### Lint/check

```bash
node check_locale_keys.js
```

Reports missing i18n keys per locale.

### Non-obvious caveats

- The webapp hardcodes `http://91.107.197.197:9000` for API calls.
- There is no package.json — `browser-sync` is installed on-demand via `npx`.
- The `desktop/` subdirectory is a separate desktop-optimized version of the same app.

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { seoPrerender } from './vite-plugin-seo';
import { SITE } from './src/lib/seo-config';

// https://vite.dev/config/
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as { version: string };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // package.json's `version` is the single source of truth — kept in step with the
    // mobile app's `app.json` version by hand; bump both together when either ships.
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    },
    plugins: [
      react(),
      tailwindcss(),
      seoPrerender({
        siteUrl: env.VITE_SITE_URL || SITE.defaultUrl,
        baseDomain: env.VITE_BASE_DOMAIN || SITE.defaultBaseDomain,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 3000,
    },
    preview: {
      host: true,
      port: 3000,
    },
  };
});

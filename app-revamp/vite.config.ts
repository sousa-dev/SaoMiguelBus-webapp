import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

import { seoPrerender } from './vite-plugin-seo';
import { SITE } from './src/lib/seo-config';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
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

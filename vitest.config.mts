import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { playwright } from '@vitest/browser-playwright';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    vanillaExtractPlugin(),
    svgr({ include: 'icons/*.svg' }),
  ],
  define: {
    'process.env': {},
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    browser: {
      enabled: true,
      instances: [
        {
          browser: 'chromium',
          provider: playwright(),
        },
      ],
      headless: true,
      screenshotFailures: false,
    },
  },
});

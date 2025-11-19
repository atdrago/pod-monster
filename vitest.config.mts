import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { playwright } from '@vitest/browser-playwright';

// eslint-disable-next-line import/no-unused-modules
export default defineConfig({
  // @ts-expect-error workaround for moduleResolution: 'bundler' issue and vite/vitest version mismatch
  plugins: [tsconfigPaths(), react(), vanillaExtractPlugin()],
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

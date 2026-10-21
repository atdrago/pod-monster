import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';
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
  // Vitest deletes `process.env` from the `define` of an inline project before
  // the browser server reads it. Thus, this `define` stays in the root config,
  // and only the browser project extends the root config.
  define: {
    'process.env': {},
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          environment: 'jsdom',
          exclude: [...configDefaults.exclude, '**/*.node.test.ts'],
          globals: true,
          setupFiles: './vitest.setup.ts',
          browser: {
            enabled: true,
            // The CI runner and a local Mac render a few edge pixels of text
            // differently. The allowance lets one set of reference images
            // pass on both.
            expect: {
              toMatchScreenshot: {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                  allowedMismatchedPixels: 10,
                },
              },
            },
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
      },
      {
        plugins: [tsconfigPaths()],
        resolve: {
          alias: {
            // The `default` entry of `server-only` throws. Next.js loads this
            // empty file under the `react-server` condition.
            'server-only': fileURLToPath(
              new URL('node_modules/server-only/empty.js', import.meta.url),
            ),
          },
        },
        test: {
          name: 'node',
          environment: 'node',
          globals: true,
          include: ['**/*.node.test.ts'],
        },
      },
    ],
  },
});

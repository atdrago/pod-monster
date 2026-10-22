import bundleAnalyzer from '@next/bundle-analyzer';
import withSvgr from 'next-plugin-svgr';
import { withSentryConfig } from '@sentry/nextjs';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // A page sends its full URL as the `Referer` of each request, and a log
  // drain records that header. The path of a `/feeds/` page can hold the token
  // of a private feed. A client navigation keeps the policy of the first
  // document, so the rule covers every path.
  async headers() {
    return [
      {
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
        source: '/:path*',
      },
    ];
  },
  images: {
    minimumCacheTTL: 31536000,
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
};

export default withSentryConfig(
  // TODO: `withSvgr` adds a `webpack()` function, and Next 16 stops a
  // Turbopack build when the config has a `webpack()` function. Thus, the
  // `build` and `dev` scripts keep the `--webpack` flag. Replace `withSvgr`
  // with a `turbopack.rules` entry for `*.svg`, and then remove the flag.
  withBundleAnalyzer(withSvgr(nextConfig)),
  {
    org: 'adam-drago',

    project: 'podmonster',
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    // Suppresses source map uploading logs during build
    silent: true,
  },
  {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: '/monitoring',

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,
  },
);

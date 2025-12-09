import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';
import bundleAnalyzer from '@next/bundle-analyzer';
import withSvgr from 'next-plugin-svgr';
import { withSentryConfig } from '@sentry/nextjs';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withVanillaExtract = createVanillaExtractPlugin();

const nextConfig = {
  images: {
    minimumCacheTTL: 31536000,
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
};

export default withSentryConfig(
  withBundleAnalyzer(withSvgr(withVanillaExtract(nextConfig))),
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

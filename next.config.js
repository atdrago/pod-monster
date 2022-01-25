const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const withSvgr = require('next-plugin-svgr');
const withPwa = require('next-pwa');

const withVanillaExtract = createVanillaExtractPlugin();

const nextConfig = {
  i18n: {
    defaultLocale: 'en-US',
    locales: ['en-US'],
  },
  images: {
    domains: ['localhost', 'podcast.fish', 'pod.monster'],
    minimumCacheTTL: 31536000,
  },
  productionBrowserSourceMaps: true,
  pwa: {
    dest: 'public',
  },
  reactStrictMode: true,
  svgrOptions: {
    icon: true,
  },
};

module.exports = withPwa(
  withBundleAnalyzer(withSvgr(withVanillaExtract(nextConfig)))
);

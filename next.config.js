const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const withSvgr = require('next-plugin-svgr');
const imageDomains = require('./utils/imageDomains');

const withVanillaExtract = createVanillaExtractPlugin();

const nextConfig = {
  i18n: {
    defaultLocale: 'en-US',
    locales: ['en-US'],
  },
  images: {
    domains: imageDomains,
    minimumCacheTTL: 31536000,
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  svgrOptions: {
    icon: true,
  },
};

module.exports = withBundleAnalyzer(withSvgr(withVanillaExtract(nextConfig)));

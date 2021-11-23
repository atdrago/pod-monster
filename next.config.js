const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const withSvgr = require('next-plugin-svgr');

const withVanillaExtract = createVanillaExtractPlugin();

const nextConfig = {
  images: {
    domains: ['localhost', 'podcast.fish'],
    minimumCacheTTL: 31536000,
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  svgrOptions: {
    icon: true,
  },
};

module.exports = withBundleAnalyzer(withSvgr(withVanillaExtract(nextConfig)));

import type { GetServerSideProps } from 'next';

import { notNullOrUndefined } from 'utils/notNullOrUndefined';

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const staticPages = ['about']
    .map((staticPagePath) => {
      return typeof staticPagePath === 'string'
        ? new URL(staticPagePath, process.env.NEXT_PUBLIC_BASE_URL).toString()
        : null;
    })
    .filter(notNullOrUndefined);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map((url) => {
      return `
        <url>
          <loc>${url}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>1.0</priority>
        </url>
      `;
    })
    .join('')}
</urlset>
  `;

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default function Sitemap(): null {
  return null;
}

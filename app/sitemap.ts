import { MetadataRoute } from 'next';

import { notNullOrUndefined } from 'utils/notNullOrUndefined';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPageMap = ['about', 'settings']
    .map((staticPagePath) => {
      const url =
        typeof staticPagePath === 'string'
          ? new URL(staticPagePath, process.env.NEXT_PUBLIC_BASE_URL).toString()
          : null;

      if (!url) {
        return null;
      }

      return {
        changeFrequency: 'monthly',
        lastModified: new Date().toISOString(),
        priority: 1,
        url,
      } as const;
    })
    .filter(notNullOrUndefined);

  return staticPageMap;
}

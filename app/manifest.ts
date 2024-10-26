import type { MetadataRoute } from 'next';

export default function metadata(): MetadataRoute.Manifest {
  return {
    background_color: '#ffffff',
    description: 'A front-end to the Podcast Index',
    display: 'minimal-ui',
    icons: [
      {
        sizes: '512x512',
        src: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        sizes: '192x192',
        src: '/android-chrome-192x192.png',
        type: 'image/png',
      },
      {
        sizes: '512x512',
        src: '/android-chrome-512x512.png',
        type: 'image/png',
      },
    ],
    name: 'Pod Monster',
    short_name: 'PodMonster',
    start_url: '/',
    theme_color: '#272822',
  };
}

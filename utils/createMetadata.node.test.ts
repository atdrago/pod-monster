import { createMetadata } from './createMetadata';

const OG_METADATA = {
  audio: 'https://example.com/members/episode.mp3?token=Secret123',
  description: 'An episode description',
  image: 'https://example.com/members/image.jpg?token=Secret123',
  title: 'An episode title',
  type: 'website',
  url: '/feeds/aHR0cHM6Ly9leGFtcGxlLmNvbS9mZWVkLnhtbA',
  video: 'https://example.com/members/episode.mp4?token=Secret123',
} as const;

describe('createMetadata', () => {
  it('should give no index, no follow, and no tag that holds a URL of the feed for a private page (AE8)', async () => {
    const metadata = await createMetadata({
      description: 'A show description',
      isPrivate: true,
      ogMetadata: OG_METADATA,
      titles: ['An episode title', 'A show title'],
    });

    expect(metadata.robots).toEqual({ follow: false, index: false });
    expect(metadata.openGraph).toEqual({
      description: 'An episode description',
      siteName: 'Pod Monster',
      title: 'An episode title',
      type: 'website',
    });
    expect(metadata.twitter).toEqual({
      card: 'summary_large_image',
      description: 'An episode description',
      site: 'pod.monster',
      title: 'An episode title',
    });
    expect(JSON.stringify(metadata)).not.toContain('example.com');
    expect(JSON.stringify(metadata)).not.toContain(OG_METADATA.url);
  });

  it('should give the title and the description for a private page', async () => {
    const metadata = await createMetadata({
      description: 'A show description',
      isPrivate: true,
      ogMetadata: OG_METADATA,
      titles: ['An episode title', 'A show title'],
    });

    expect(metadata).toMatchObject({
      description: 'A show description',
      title: 'An episode title - A show title - Pod Monster',
    });
  });

  it('should give the same metadata as before when the page is not private', async () => {
    const metadata = await createMetadata({
      description: 'A show description',
      ogMetadata: OG_METADATA,
      titles: ['An episode title', 'A show title'],
    });

    expect(metadata).toEqual({
      appleWebApp: {
        capable: true,
        title: 'An episode title - A show title - Pod Monster',
      },
      applicationName: 'Pod Monster',
      description: 'A show description',
      openGraph: {
        audio: OG_METADATA.audio,
        description: 'An episode description',
        images: OG_METADATA.image,
        siteName: 'Pod Monster',
        title: 'An episode title',
        type: 'website',
        url: OG_METADATA.url,
        videos: OG_METADATA.video,
      },
      title: 'An episode title - A show title - Pod Monster',
      twitter: {
        card: 'summary_large_image',
        description: 'An episode description',
        images: OG_METADATA.image,
        site: 'pod.monster',
        title: 'An episode title',
      },
    });
    expect(metadata.robots).toBeUndefined();
  });

  it('should give the same metadata as before when the private option is false', async () => {
    const options = {
      description: 'A show description',
      ogMetadata: OG_METADATA,
      titles: ['A show title'],
    };

    expect(await createMetadata({ ...options, isPrivate: false })).toEqual(
      await createMetadata(options),
    );
  });

  it('should give no Open Graph URL and no image when the page gives no Open Graph data', async () => {
    const metadata = await createMetadata({
      description: '404 - Not found',
      titles: ['404', 'Not found'],
    });

    expect(metadata.openGraph?.url).toBeUndefined();
    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.robots).toBeUndefined();
  });
});

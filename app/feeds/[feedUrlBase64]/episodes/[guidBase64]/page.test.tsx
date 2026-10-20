import { notFound, permanentRedirect } from 'next/navigation';

import type { PodcastEpisode, PodcastFeed } from 'types/PodcastFeed';
import { encodeBase64Url } from 'utils/base64Url';
import { getEpisodePath } from 'utils/paths';
import { loadEpisode } from 'utils/server/loadFeed';

import Page, { generateMetadata } from './page';

vi.mock('server-only', () => ({}));
// The browser runner reads the named exports of a mocked CommonJS package
// from its default export.
vi.mock('next/server', () => {
  const connection = vi.fn(async () => {});

  return { connection, default: { connection } };
});
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  permanentRedirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));
vi.mock('utils/server/loadFeed', () => ({ loadEpisode: vi.fn() }));
vi.mock('utils/server/probeImage', () => ({ probeImage: vi.fn() }));

const FEED_URL = 'https://example.com/feed.xml';
const PRIVATE_FEED_URL = 'https://www.patreon.com/rss/show?auth=Token123';
// The length of this identity is not a multiple of 3, so its standard base64
// form ends with padding.
const EPISODE_IDENTITY = 'episode-12';

const FEED: PodcastFeed = {
  format: 'rss',
  isSerial: false,
  title: 'Example Show',
  url: FEED_URL,
};

const EPISODE: PodcastEpisode = {
  enclosureType: 'audio/mpeg',
  enclosureUrl: 'https://example.com/episode-12.mp3',
  feedTitle: 'Example Show',
  feedUrl: FEED_URL,
  identity: EPISODE_IDENTITY,
  title: 'Episode 12',
};

function createProps(
  feedUrlBase64: string,
  guidBase64: string,
  searchParams: Record<string, string> = {},
) {
  return {
    // Next.js passes each page param through `encodeURIComponent`.
    params: Promise.resolve({
      feedUrlBase64: encodeURIComponent(feedUrlBase64),
      guidBase64: encodeURIComponent(guidBase64),
    }),
    searchParams: Promise.resolve(searchParams),
  };
}

describe('feeds episode page', () => {
  afterEach(() => {
    vi.mocked(loadEpisode).mockReset();
    vi.mocked(notFound).mockClear();
    vi.mocked(permanentRedirect).mockClear();
  });

  it('should redirect a standard base64 episode segment with padding to the canonical path, and keep `t`', async () => {
    const standardGuidSegment = btoa(EPISODE_IDENTITY);

    expect(standardGuidSegment).toMatch(/=$/);

    await expect(
      generateMetadata(
        createProps(encodeBase64Url(FEED_URL), standardGuidSegment, {
          t: '90',
        }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(permanentRedirect).toHaveBeenCalledWith(
      `${getEpisodePath({ episodeIdentity: EPISODE_IDENTITY, feedUrl: FEED_URL })}?t=90`,
    );
    expect(loadEpisode).not.toHaveBeenCalled();
  });

  it('should redirect a feed URL that is not normalized to the path of the normalized URL, and keep `t`', async () => {
    await expect(
      Page(
        createProps(
          encodeBase64Url('HTTPS://Example.com:443/feed.xml#top'),
          encodeBase64Url(EPISODE_IDENTITY),
          { t: '90' },
        ),
      ),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(permanentRedirect).toHaveBeenCalledWith(
      `${getEpisodePath({ episodeIdentity: EPISODE_IDENTITY, feedUrl: FEED_URL })}?t=90`,
    );
    expect(loadEpisode).not.toHaveBeenCalled();
  });

  it('should answer an episode segment that does not decode with not found, and load nothing', async () => {
    await expect(
      Page(createProps(encodeBase64Url(FEED_URL), 'not*base64')),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalledOnce();
    expect(loadEpisode).not.toHaveBeenCalled();
  });

  it('should answer an episode that neither source knows with not found', async () => {
    vi.mocked(loadEpisode).mockResolvedValue({ kind: 'not_found' });

    const props = createProps(
      encodeBase64Url(FEED_URL),
      encodeBase64Url(EPISODE_IDENTITY),
    );

    await expect(generateMetadata(props)).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(Page(props)).rejects.toThrow('NEXT_NOT_FOUND');
    expect(loadEpisode).toHaveBeenCalledWith(
      encodeBase64Url(FEED_URL),
      encodeBase64Url(EPISODE_IDENTITY),
    );
  });

  it('should ask search engines not to index an episode of a private show, and give it no og:url or audio', async () => {
    vi.mocked(loadEpisode).mockResolvedValue({
      episode: { ...EPISODE, feedUrl: PRIVATE_FEED_URL },
      feed: { ...FEED, url: PRIVATE_FEED_URL },
      isPrivate: true,
      kind: 'found',
      source: 'rss',
    });

    const metadata = await generateMetadata(
      createProps(
        encodeBase64Url(PRIVATE_FEED_URL),
        encodeBase64Url(EPISODE_IDENTITY),
      ),
    );

    expect(metadata.robots).toEqual({ follow: false, index: false });
    expect(metadata.openGraph?.url).toBeUndefined();
    expect(metadata.openGraph?.audio).toBeUndefined();
  });

  it('should let search engines index an episode of a public show, with its share path as og:url', async () => {
    vi.mocked(loadEpisode).mockResolvedValue({
      episode: EPISODE,
      feed: FEED,
      isPrivate: false,
      kind: 'found',
      source: 'podcastIndex',
    });

    const metadata = await generateMetadata(
      createProps(encodeBase64Url(FEED_URL), encodeBase64Url(EPISODE_IDENTITY)),
    );

    expect(metadata.robots).toBeUndefined();
    expect(metadata.openGraph?.url).toBe(
      getEpisodePath({ episodeIdentity: EPISODE_IDENTITY, feedUrl: FEED_URL }),
    );
  });
});

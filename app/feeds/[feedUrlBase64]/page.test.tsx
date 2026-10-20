import { notFound, permanentRedirect } from 'next/navigation';

import type { PodcastFeed } from 'types/PodcastFeed';
import { encodeBase64Url } from 'utils/base64Url';
import { getPodcastPath } from 'utils/paths';
import { loadShow } from 'utils/server/loadFeed';

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
vi.mock('utils/server/loadFeed', () => ({ loadShow: vi.fn() }));

// The length of this URL is not a multiple of 3, so its standard base64 form
// ends with padding.
const FEED_URL = 'https://example.com/feed.xml';
const PRIVATE_FEED_URL = 'https://www.patreon.com/rss/show?auth=Token123';

const FEED: PodcastFeed = {
  format: 'rss',
  isSerial: false,
  title: 'Example Show',
  url: FEED_URL,
};

function createProps(
  feedUrlBase64: string,
  searchParams: Record<string, string> = {},
) {
  return {
    // Next.js passes each page param through `encodeURIComponent`.
    params: Promise.resolve({
      feedUrlBase64: encodeURIComponent(feedUrlBase64),
    }),
    searchParams: Promise.resolve(searchParams),
  };
}

describe('feeds show page', () => {
  afterEach(() => {
    vi.mocked(loadShow).mockReset();
    vi.mocked(notFound).mockClear();
    vi.mocked(permanentRedirect).mockClear();
  });

  it('should redirect a standard base64 segment with padding to the canonical path, and keep the query', async () => {
    const standardSegment = btoa(FEED_URL);

    expect(standardSegment).toMatch(/=$/);
    expect(standardSegment).not.toBe(encodeBase64Url(FEED_URL));

    await expect(
      generateMetadata(createProps(standardSegment, { ref: 'share' })),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(permanentRedirect).toHaveBeenCalledWith(
      `${getPodcastPath({ feedUrl: FEED_URL })}?ref=share`,
    );
    expect(loadShow).not.toHaveBeenCalled();
  });

  it('should answer a segment that does not decode with not found, and load nothing', async () => {
    await expect(Page(createProps('not*base64'))).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(notFound).toHaveBeenCalledOnce();
    expect(loadShow).not.toHaveBeenCalled();
  });

  it('should answer a show that neither source knows with not found', async () => {
    vi.mocked(loadShow).mockResolvedValue({ kind: 'not_found' });

    const props = createProps(encodeBase64Url(FEED_URL));

    await expect(generateMetadata(props)).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(Page(props)).rejects.toThrow('NEXT_NOT_FOUND');
    expect(loadShow).toHaveBeenCalledWith(encodeBase64Url(FEED_URL));
  });

  it('should ask search engines not to index a private show, and give it no og:url', async () => {
    vi.mocked(loadShow).mockResolvedValue({
      episodes: [],
      feed: { ...FEED, url: PRIVATE_FEED_URL },
      isPrivate: true,
      kind: 'found',
      source: 'rss',
    });

    const metadata = await generateMetadata(
      createProps(encodeBase64Url(PRIVATE_FEED_URL)),
    );

    expect(metadata.robots).toEqual({ follow: false, index: false });
    expect(metadata.openGraph?.url).toBeUndefined();
  });

  it('should let search engines index a public show, with its share path as og:url', async () => {
    vi.mocked(loadShow).mockResolvedValue({
      episodes: [],
      feed: FEED,
      isPrivate: false,
      kind: 'found',
      source: 'podcastIndex',
    });

    const metadata = await generateMetadata(
      createProps(encodeBase64Url(FEED_URL)),
    );

    expect(metadata.robots).toBeUndefined();
    expect(metadata.openGraph?.url).toBe(getPodcastPath({ feedUrl: FEED_URL }));
  });
});

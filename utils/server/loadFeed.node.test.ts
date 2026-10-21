import { captureMessage } from '@sentry/nextjs';
import { cache } from 'react';

import { encodeBase64Url } from 'utils/base64Url';
import { FeedUnavailableError } from 'utils/server/FeedUnavailableError';
import { safeFetchFeed } from 'utils/server/safeFetchFeed';

import { loadEpisode, loadShow } from './loadFeed';

const { memoizedResultMaps } = vi.hoisted(() => ({
  memoizedResultMaps: new Array<Map<string, unknown>>(),
}));

// React memoizes `cache` only inside a server render, so a direct call in Node
// shows no dedupe. This stub memoizes by the arguments.
vi.mock('react', () => ({
  cache: vi.fn(
    <TArgs extends Array<string>, TResult>(
      loader: (...args: TArgs) => TResult,
    ) => {
      const results = new Map<string, unknown>();

      memoizedResultMaps.push(results);

      return (...args: TArgs): TResult => {
        const key = JSON.stringify(args);

        if (!results.has(key)) {
          results.set(key, loader(...args));
        }

        return results.get(key) as TResult;
      };
    },
  ),
}));
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));
vi.mock('utils/server/safeFetchFeed', () => ({ safeFetchFeed: vi.fn() }));

const FEED_URL = 'https://example.com/feed.xml';
const PODCAST_INDEX_FEED_ID = 920666;
const PATREON_FEED_URL = 'https://www.patreon.com/rss/x?auth=abc';

type PodcastIndexCall =
  | 'episodeByGuid'
  | 'episodesByFeedId'
  | 'podcastsByFeedUrl';

type PodcastIndexAnswer = (requestUrl: URL) => Promise<Response>;

interface RssItem {
  datePublished?: Date;
  guid: string;
  title?: string;
}

function createRssFeed(items: Array<RssItem>) {
  const itemsXml = items
    .map(
      ({ datePublished, guid, title = `Episode ${guid}` }) => `<item>
        <title>${title}</title>
        <guid isPermaLink="false">${guid}</guid>
        <enclosure url="https://example.com/${encodeURIComponent(guid)}.mp3" length="1" type="audio/mpeg"/>
        ${datePublished === undefined ? '' : `<pubDate>${datePublished.toUTCString()}</pubDate>`}
      </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>RSS Show</title>
    <link>https://example.com/show</link>
    <description>RSS description</description>
    ${itemsXml}
  </channel>
</rss>`;
}

function stubRssFeed(items: Array<RssItem>) {
  vi.mocked(safeFetchFeed).mockResolvedValue({
    body: createRssFeed(items),
    kind: 'ok',
  });
}

function createPodcastIndexFeedAnswer(): PodcastIndexAnswer {
  return async () =>
    Response.json({
      description: 'Found matching feed',
      feed: {
        author: 'Podcast Index Author',
        categories: { '9': 'Business' },
        description: 'Podcast Index description',
        explicit: false,
        id: PODCAST_INDEX_FEED_ID,
        image: 'https://example.com/podcast-index.jpg',
        link: 'https://example.com/show',
        title: 'Podcast Index Show',
        type: 0,
        url: FEED_URL,
      },
      status: 'true',
    });
}

function createPodcastIndexEpisodeJson(guid: string) {
  return {
    chaptersUrl: null,
    datePublished: 1_696_420_740,
    description: 'Podcast Index episode description',
    duration: 3723,
    enclosureType: 'audio/mpeg',
    enclosureUrl: 'https://example.com/podcast-index.mp3',
    episode: null,
    episodeType: 'full',
    explicit: 0,
    feedId: PODCAST_INDEX_FEED_ID,
    feedImage: 'https://example.com/podcast-index.jpg',
    feedTitle: 'Podcast Index Show',
    guid,
    id: 16_795_090,
    image: '',
    season: 0,
    title: `Podcast Index ${guid.trim()}`,
  };
}

const PODCAST_INDEX_FEED_MISS: PodcastIndexAnswer = async () =>
  Response.json({
    description: 'No feeds match this url.',
    feed: [],
    status: 'true',
  });

const PODCAST_INDEX_CALLS: Record<string, PodcastIndexCall> = {
  'episodes/byfeedid': 'episodesByFeedId',
  'episodes/byguid': 'episodeByGuid',
  'podcasts/byfeedurl': 'podcastsByFeedUrl',
};

function stubPodcastIndex(
  answers: Partial<Record<PodcastIndexCall, PodcastIndexAnswer>>,
) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input: RequestInfo | URL) => {
      const requestUrl = new URL(String(input));

      if (requestUrl.origin !== 'https://api.podcastindex.org') {
        throw new Error(`The test has no answer for ${requestUrl.origin}`);
      }

      const endpoint = requestUrl.pathname.replace('/api/1.0/', '');
      const answer = answers[PODCAST_INDEX_CALLS[endpoint]];

      if (answer === undefined) {
        throw new Error(`The test has no answer for ${endpoint}`);
      }

      return answer(requestUrl);
    });
}

function getPodcastIndexEndpoints(
  fetchSpy: ReturnType<typeof stubPodcastIndex>,
) {
  return fetchSpy.mock.calls.map(([input]) =>
    new URL(String(input)).pathname.replace('/api/1.0/', ''),
  );
}

function expectNoFeedValueInLogs(...values: Array<string>) {
  const loggedText = JSON.stringify(vi.mocked(captureMessage).mock.calls);

  for (const value of values) {
    expect(loggedText).not.toContain(value);
    expect(loggedText).not.toContain(encodeBase64Url(value));
  }
}

describe('loadFeed', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_KEY', 'test-api-key');
    vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_SECRET', 'test-api-secret');
  });

  afterEach(() => {
    for (const results of memoizedResultMaps) {
      results.clear();
    }

    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.mocked(captureMessage).mockClear();
    vi.mocked(safeFetchFeed).mockReset();
  });

  describe('show loader', () => {
    it('should give the show and its episodes from Podcast Index when Podcast Index knows the show', async () => {
      const fetchSpy = stubPodcastIndex({
        episodesByFeedId: async () =>
          Response.json({
            count: 2,
            items: [
              createPodcastIndexEpisodeJson('episode-2'),
              createPodcastIndexEpisodeJson('episode-1'),
            ],
            status: 'true',
          }),
        podcastsByFeedUrl: createPodcastIndexFeedAnswer(),
      });

      const result = await loadShow(encodeBase64Url(FEED_URL));

      expect(result).toMatchObject({
        feed: {
          podcastIndexId: PODCAST_INDEX_FEED_ID,
          title: 'Podcast Index Show',
          url: FEED_URL,
        },
        isPrivate: false,
        kind: 'found',
        source: 'podcastIndex',
      });
      expect(
        result.kind === 'found' &&
          result.episodes.map(({ identity }) => identity),
      ).toEqual(['episode-2', 'episode-1']);
      expect(safeFetchFeed).not.toHaveBeenCalled();

      const episodesRequestUrl = new URL(String(fetchSpy.mock.calls[1][0]));

      expect(episodesRequestUrl.searchParams.get('id')).toBe(
        `${PODCAST_INDEX_FEED_ID}`,
      );
    });

    it('should keep only the first Podcast Index episode of each identity', async () => {
      stubPodcastIndex({
        episodesByFeedId: async () =>
          Response.json({
            count: 3,
            items: [
              {
                ...createPodcastIndexEpisodeJson('episode-1'),
                title: 'First copy',
              },
              createPodcastIndexEpisodeJson('episode-2'),
              {
                ...createPodcastIndexEpisodeJson(' episode-1 '),
                title: 'Second copy',
              },
            ],
            status: 'true',
          }),
        podcastsByFeedUrl: createPodcastIndexFeedAnswer(),
      });

      const result = await loadShow(encodeBase64Url(FEED_URL));

      expect(
        result.kind === 'found' &&
          result.episodes.map(({ identity, title }) => ({ identity, title })),
      ).toEqual([
        { identity: 'episode-1', title: 'First copy' },
        { identity: 'episode-2', title: 'Podcast Index episode-2' },
      ]);
    });

    it('should read the RSS feed when Podcast Index answers with an empty feed (AE1)', async () => {
      stubPodcastIndex({ podcastsByFeedUrl: PODCAST_INDEX_FEED_MISS });
      stubRssFeed([{ guid: 'episode-1' }]);

      const result = await loadShow(encodeBase64Url(FEED_URL));

      expect(result).toMatchObject({
        episodes: [{ identity: 'episode-1' }],
        feed: { podcastIndexId: undefined, title: 'RSS Show', url: FEED_URL },
        isPrivate: false,
        kind: 'found',
        source: 'rss',
      });
      expect(safeFetchFeed).toHaveBeenCalledWith(FEED_URL);
      expect(captureMessage).not.toHaveBeenCalled();
    });

    it('should read the RSS feed and keep the Podcast Index id when the episode list fails', async () => {
      stubPodcastIndex({
        episodesByFeedId: async () => new Response(null, { status: 500 }),
        podcastsByFeedUrl: createPodcastIndexFeedAnswer(),
      });
      stubRssFeed([{ guid: 'episode-1' }]);

      const result = await loadShow(encodeBase64Url(FEED_URL));

      expect(result).toMatchObject({
        feed: { podcastIndexId: PODCAST_INDEX_FEED_ID, title: 'RSS Show' },
        kind: 'found',
        source: 'rss',
      });
    });

    it('should sort the RSS episodes newest first and keep the 100 newest', async () => {
      const firstDate = Date.UTC(2020, 0, 1);
      const dayMilliseconds = 24 * 60 * 60 * 1000;

      stubPodcastIndex({ podcastsByFeedUrl: PODCAST_INDEX_FEED_MISS });
      stubRssFeed(
        Array.from({ length: 150 }, (_, i) => ({
          datePublished: new Date(firstDate + i * dayMilliseconds),
          guid: `episode-${i + 1}`,
        })),
      );

      const result = await loadShow(encodeBase64Url(FEED_URL));

      expect(result.kind).toBe('found');

      if (result.kind !== 'found') {
        return;
      }

      expect(result.episodes).toHaveLength(100);
      expect(result.episodes[0].identity).toBe('episode-150');
      expect(result.episodes[99].identity).toBe('episode-51');
    });
  });

  describe('episode loader', () => {
    it('should give the episode from Podcast Index when Podcast Index knows it', async () => {
      const fetchSpy = stubPodcastIndex({
        episodeByGuid: async () =>
          Response.json({
            episode: createPodcastIndexEpisodeJson('episode-1'),
            status: 'true',
          }),
        podcastsByFeedUrl: createPodcastIndexFeedAnswer(),
      });

      const result = await loadEpisode(
        encodeBase64Url(FEED_URL),
        encodeBase64Url('episode-1'),
      );

      expect(result).toMatchObject({
        episode: { identity: 'episode-1', title: 'Podcast Index episode-1' },
        feed: { podcastIndexId: PODCAST_INDEX_FEED_ID, url: FEED_URL },
        isPrivate: false,
        kind: 'found',
        source: 'podcastIndex',
      });
      expect(getPodcastIndexEndpoints(fetchSpy)).toEqual([
        'podcasts/byfeedurl',
        'episodes/byguid',
      ]);
      expect(safeFetchFeed).not.toHaveBeenCalled();
    });

    it('should take the episode from the RSS feed when Podcast Index knows the show but not the episode (AE2)', async () => {
      stubPodcastIndex({
        episodeByGuid: async () =>
          Response.json({
            description: 'No episodes match this guid.',
            episode: [],
            status: 'true',
          }),
        podcastsByFeedUrl: createPodcastIndexFeedAnswer(),
      });
      stubRssFeed([{ guid: 'episode-2' }, { guid: 'episode-1' }]);

      const result = await loadEpisode(
        encodeBase64Url(FEED_URL),
        encodeBase64Url('episode-2'),
      );

      expect(result).toMatchObject({
        episode: { identity: 'episode-2', title: 'Episode episode-2' },
        feed: { podcastIndexId: PODCAST_INDEX_FEED_ID, title: 'RSS Show' },
        kind: 'found',
        source: 'rss',
      });
    });

    it('should not call Podcast Index for the episode when Podcast Index does not know the show', async () => {
      const fetchSpy = stubPodcastIndex({
        podcastsByFeedUrl: PODCAST_INDEX_FEED_MISS,
      });

      stubRssFeed([{ guid: 'episode-1' }]);

      const result = await loadEpisode(
        encodeBase64Url(FEED_URL),
        encodeBase64Url('episode-1'),
      );

      expect(result).toMatchObject({ kind: 'found', source: 'rss' });
      expect(getPodcastIndexEndpoints(fetchSpy)).toEqual([
        'podcasts/byfeedurl',
      ]);
    });

    it('should read the RSS feed when Podcast Index gives an episode with another identity', async () => {
      stubPodcastIndex({
        episodeByGuid: async () =>
          Response.json({
            episode: createPodcastIndexEpisodeJson('another-episode'),
            status: 'true',
          }),
        podcastsByFeedUrl: createPodcastIndexFeedAnswer(),
      });
      stubRssFeed([{ guid: 'episode-1' }]);

      const result = await loadEpisode(
        encodeBase64Url(FEED_URL),
        encodeBase64Url('episode-1'),
      );

      expect(result).toMatchObject({
        episode: { identity: 'episode-1' },
        source: 'rss',
      });
    });

    it('should load the 150th item of an RSS-only feed with 150 items', async () => {
      stubPodcastIndex({ podcastsByFeedUrl: PODCAST_INDEX_FEED_MISS });
      stubRssFeed(
        Array.from({ length: 150 }, (_, i) => ({
          datePublished: new Date(Date.UTC(2030, 0, 1) - i * 1000),
          guid: `episode-${i + 1}`,
        })),
      );

      const result = await loadEpisode(
        encodeBase64Url(FEED_URL),
        encodeBase64Url('episode-150'),
      );

      expect(result).toMatchObject({
        episode: { identity: 'episode-150' },
        kind: 'found',
        source: 'rss',
      });
    });

    it('should give not-found for a guid that is in neither source', async () => {
      stubPodcastIndex({
        episodeByGuid: async () =>
          Response.json({ episode: [], status: 'true' }),
        podcastsByFeedUrl: createPodcastIndexFeedAnswer(),
      });
      stubRssFeed([{ guid: 'episode-1' }]);

      await expect(
        loadEpisode(encodeBase64Url(FEED_URL), encodeBase64Url('unknown')),
      ).resolves.toEqual({ kind: 'not_found' });
    });

    it('should give the same identity from Podcast Index and from the RSS feed when one guid has a space at its end', async () => {
      const otherFeedUrl = 'https://example.com/other-feed.xml';

      const podcastIndexFeedAnswer = createPodcastIndexFeedAnswer();

      stubPodcastIndex({
        episodeByGuid: async () =>
          Response.json({
            episode: createPodcastIndexEpisodeJson('episode-1 '),
            status: 'true',
          }),
        podcastsByFeedUrl: async (requestUrl) =>
          requestUrl.searchParams.get('url') === FEED_URL
            ? podcastIndexFeedAnswer(requestUrl)
            : PODCAST_INDEX_FEED_MISS(requestUrl),
      });
      stubRssFeed([{ guid: 'episode-1' }]);

      const podcastIndexResult = await loadEpisode(
        encodeBase64Url(FEED_URL),
        encodeBase64Url('episode-1'),
      );

      const rssResult = await loadEpisode(
        encodeBase64Url(otherFeedUrl),
        encodeBase64Url('episode-1'),
      );

      expect(podcastIndexResult).toMatchObject({ source: 'podcastIndex' });
      expect(rssResult).toMatchObject({ source: 'rss' });
      expect(
        podcastIndexResult.kind === 'found' &&
          podcastIndexResult.episode.identity,
      ).toBe('episode-1');
      expect(rssResult.kind === 'found' && rssResult.episode.identity).toBe(
        'episode-1',
      );
    });
  });

  describe('private feeds', () => {
    it('should send no request to Podcast Index for a Patreon member feed, and read the RSS feed (AE8)', async () => {
      const fetchSpy = stubPodcastIndex({});

      stubRssFeed([{ guid: 'episode-1' }]);

      const showResult = await loadShow(encodeBase64Url(PATREON_FEED_URL));
      const episodeResult = await loadEpisode(
        encodeBase64Url(PATREON_FEED_URL),
        encodeBase64Url('episode-1'),
      );

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(showResult).toMatchObject({
        isPrivate: true,
        kind: 'found',
        source: 'rss',
      });
      expect(episodeResult).toMatchObject({
        isPrivate: true,
        kind: 'found',
        source: 'rss',
      });
      expect(safeFetchFeed).toHaveBeenCalledWith(PATREON_FEED_URL);
    });

    it('should give not-found for a feed URL with a user name or a password, with no network call', async () => {
      const fetchSpy = stubPodcastIndex({});

      await expect(
        loadShow(encodeBase64Url('https://user:secret@example.com/feed.xml')),
      ).resolves.toEqual({ kind: 'not_found' });
      await expect(
        loadShow(encodeBase64Url('https://user@example.com/feed.xml')),
      ).resolves.toEqual({ kind: 'not_found' });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(safeFetchFeed).not.toHaveBeenCalled();
    });
  });

  describe('Podcast Index failures', () => {
    it('should read the RSS feed with no Podcast Index call when the Podcast Index keys are missing', async () => {
      const fetchSpy = stubPodcastIndex({});

      vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_SECRET', '');
      stubRssFeed([{ guid: 'episode-1' }]);

      const result = await loadShow(encodeBase64Url(FEED_URL));

      expect(result).toMatchObject({ kind: 'found', source: 'rss' });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(captureMessage).toHaveBeenCalledWith('podcast_index_auth_failed', {
        extra: { reason: 'missing_credentials', source: 'podcastIndex' },
        level: 'error',
      });
    });

    it('should read the RSS feed after a 503, and log podcast_index_unavailable with no feed URL', async () => {
      stubPodcastIndex({
        podcastsByFeedUrl: async () => new Response(null, { status: 503 }),
      });
      stubRssFeed([{ guid: 'episode-1' }]);

      const result = await loadShow(encodeBase64Url(FEED_URL));

      expect(result).toMatchObject({ kind: 'found', source: 'rss' });
      expect(captureMessage).toHaveBeenCalledWith('podcast_index_unavailable', {
        extra: {
          endpoint: 'podcasts/byfeedurl',
          reason: 'http_status',
          source: 'podcastIndex',
          status: 503,
        },
        level: 'warning',
      });
      expectNoFeedValueInLogs(FEED_URL);
    });

    it('should read the RSS feed after a Podcast Index timeout', async () => {
      stubPodcastIndex({
        podcastsByFeedUrl: async () => {
          throw new DOMException(
            'The operation was aborted due to timeout',
            'TimeoutError',
          );
        },
      });
      stubRssFeed([{ guid: 'episode-1' }]);

      const result = await loadShow(encodeBase64Url(FEED_URL));

      expect(result).toMatchObject({ kind: 'found', source: 'rss' });
      expect(captureMessage).toHaveBeenCalledWith(
        'podcast_index_unavailable',
        expect.objectContaining({
          extra: expect.objectContaining({ reason: 'timeout' }),
        }),
      );
    });

    it('should read the RSS feed after a Podcast Index network error', async () => {
      stubPodcastIndex({
        podcastsByFeedUrl: async () => {
          throw new TypeError('fetch failed');
        },
      });
      stubRssFeed([{ guid: 'episode-1' }]);

      const result = await loadShow(encodeBase64Url(FEED_URL));

      expect(result).toMatchObject({ kind: 'found', source: 'rss' });
      expect(captureMessage).toHaveBeenCalledWith(
        'podcast_index_unavailable',
        expect.objectContaining({
          extra: expect.objectContaining({ reason: 'network' }),
        }),
      );
    });

    it.each([400, 401])(
      'should log podcast_index_auth_failed after a %i, and still read the RSS feed',
      async (status) => {
        stubPodcastIndex({
          podcastsByFeedUrl: async () => new Response(null, { status }),
        });
        stubRssFeed([{ guid: 'episode-1' }]);

        const result = await loadShow(encodeBase64Url(FEED_URL));

        expect(result).toMatchObject({ kind: 'found', source: 'rss' });
        expect(captureMessage).toHaveBeenCalledWith(
          'podcast_index_auth_failed',
          {
            extra: {
              endpoint: 'podcasts/byfeedurl',
              reason: 'http_status',
              source: 'podcastIndex',
              status,
            },
            level: 'error',
          },
        );
        expectNoFeedValueInLogs(FEED_URL);
      },
    );

    it('should read the RSS feed when the status of the answer is not "true"', async () => {
      stubPodcastIndex({
        podcastsByFeedUrl: async () =>
          Response.json({ description: 'Error', status: 'false' }),
      });
      stubRssFeed([{ guid: 'episode-1' }]);

      await expect(loadShow(encodeBase64Url(FEED_URL))).resolves.toMatchObject({
        kind: 'found',
        source: 'rss',
      });
    });

    it('should log the episode endpoint and no guid when episodes/byguid fails', async () => {
      const guid = 'secret-guid-value';

      stubPodcastIndex({
        episodeByGuid: async () => new Response(null, { status: 502 }),
        podcastsByFeedUrl: createPodcastIndexFeedAnswer(),
      });
      stubRssFeed([{ guid }]);

      const result = await loadEpisode(
        encodeBase64Url(FEED_URL),
        encodeBase64Url(guid),
      );

      expect(result).toMatchObject({ kind: 'found', source: 'rss' });
      expect(captureMessage).toHaveBeenCalledWith(
        'podcast_index_unavailable',
        expect.objectContaining({
          extra: expect.objectContaining({
            endpoint: 'episodes/byguid',
            status: 502,
          }),
        }),
      );
      expectNoFeedValueInLogs(FEED_URL, guid);
    });
  });

  describe('RSS failures', () => {
    beforeEach(() => {
      stubPodcastIndex({ podcastsByFeedUrl: PODCAST_INDEX_FEED_MISS });
    });

    it.each([
      ['timeout', { kind: 'error', reason: 'timeout' }],
      ['network', { kind: 'error', reason: 'network' }],
      ['too_large', { kind: 'error', reason: 'too_large', status: 200 }],
      ['http_status', { kind: 'error', reason: 'http_status', status: 503 }],
      ['http_status', { kind: 'error', reason: 'http_status', status: 429 }],
    ] as const)(
      'should throw FeedUnavailableError with the reason %s for a transient failure',
      async (reason, failure) => {
        vi.mocked(safeFetchFeed).mockResolvedValue(failure);

        const showLoad = loadShow(encodeBase64Url(FEED_URL));

        await expect(showLoad).rejects.toBeInstanceOf(FeedUnavailableError);
        await expect(showLoad).rejects.toMatchObject({ reason });
        await expect(
          loadEpisode(encodeBase64Url(FEED_URL), encodeBase64Url('episode-1')),
        ).rejects.toMatchObject({ reason });
      },
    );

    it('should keep the feed URL out of the error', async () => {
      vi.mocked(safeFetchFeed).mockResolvedValue({
        kind: 'error',
        reason: 'timeout',
      });

      const error = await loadShow(encodeBase64Url(FEED_URL)).catch(
        (rejection: unknown) => rejection,
      );

      expect(error).toBeInstanceOf(FeedUnavailableError);
      expect(JSON.stringify(error)).not.toContain('example.com');
      expect(String(error)).not.toContain('example.com');
    });

    it.each([
      { kind: 'error', reason: 'blocked' },
      { kind: 'error', reason: 'http_status', status: 401 },
      { kind: 'error', reason: 'http_status', status: 403 },
      { kind: 'error', reason: 'http_status', status: 404 },
      { kind: 'error', reason: 'http_status', status: 410 },
    ] as const)('should give not-found for the failure %o', async (failure) => {
      vi.mocked(safeFetchFeed).mockResolvedValue(failure);

      await expect(loadShow(encodeBase64Url(FEED_URL))).resolves.toEqual({
        kind: 'not_found',
      });
      await expect(
        loadEpisode(encodeBase64Url(FEED_URL), encodeBase64Url('episode-1')),
      ).resolves.toEqual({ kind: 'not_found' });
    });

    it('should give not-found for a document that is not a feed', async () => {
      vi.mocked(safeFetchFeed).mockResolvedValue({
        body: '<html><body>Not a feed</body></html>',
        kind: 'ok',
      });

      await expect(loadShow(encodeBase64Url(FEED_URL))).resolves.toEqual({
        kind: 'not_found',
      });
    });
  });

  describe('path segments', () => {
    it('should give not-found with no network call for a feed segment that does not decode', async () => {
      const fetchSpy = stubPodcastIndex({});

      await expect(loadShow('not*base64')).resolves.toEqual({
        kind: 'not_found',
      });
      await expect(
        loadShow(encodeBase64Url('ftp://example.com/feed.xml')),
      ).resolves.toEqual({ kind: 'not_found' });
      await expect(
        loadEpisode('not*base64', encodeBase64Url('episode-1')),
      ).resolves.toEqual({ kind: 'not_found' });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(safeFetchFeed).not.toHaveBeenCalled();
    });

    it('should give not-found with no network call for an episode segment that does not decode', async () => {
      const fetchSpy = stubPodcastIndex({});

      await expect(
        loadEpisode(encodeBase64Url(FEED_URL), 'not*base64'),
      ).resolves.toEqual({ kind: 'not_found' });
      await expect(
        loadEpisode(encodeBase64Url(FEED_URL), encodeBase64Url(' episode-1')),
      ).resolves.toEqual({ kind: 'not_found' });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(safeFetchFeed).not.toHaveBeenCalled();
    });
  });

  describe('request memoization', () => {
    it('should send both loaders through cache from react', async () => {
      stubPodcastIndex({ podcastsByFeedUrl: PODCAST_INDEX_FEED_MISS });
      stubRssFeed([{ guid: 'episode-1' }]);

      await loadShow(encodeBase64Url(FEED_URL));
      await loadShow(encodeBase64Url(FEED_URL));
      await loadEpisode(
        encodeBase64Url(FEED_URL),
        encodeBase64Url('episode-1'),
      );
      await loadEpisode(
        encodeBase64Url(FEED_URL),
        encodeBase64Url('episode-1'),
      );

      expect(cache).toHaveBeenCalledTimes(2);
      expect(safeFetchFeed).toHaveBeenCalledTimes(2);
    });
  });
});

import { captureMessage } from '@sentry/nextjs';

import { encodeBase64Url } from 'utils/base64Url';

import { GET } from './route';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const FEED_ID = '920666';
const EPISODE_ID = '16795090';
const FEED_URL = 'https://example.com/feed.xml';
const GUID = 'episode-guid-1';
const ENCLOSURE_URL = 'https://example.com/episode-1.mp3';

type PodcastIndexAnswer = () => Promise<Response>;

interface PodcastIndexAnswers {
  episode?: PodcastIndexAnswer;
  feed?: PodcastIndexAnswer;
}

function createEpisodeRequest(feedId: string, episodeId: string, query = '') {
  return [
    new Request(
      `https://pod.monster/podcasts/${feedId}/episodes/${episodeId}${query}`,
    ),
    { params: Promise.resolve({ episodeId, feedId }) },
  ] as const;
}

function createEpisodeAnswer(
  episodeFields: Record<string, unknown> = {},
): PodcastIndexAnswer {
  return async () =>
    Response.json({
      description: 'Found matching item.',
      episode: {
        enclosureUrl: ENCLOSURE_URL,
        feedId: Number(FEED_ID),
        guid: GUID,
        id: Number(EPISODE_ID),
        title: 'Episode 1',
        ...episodeFields,
      },
      id: EPISODE_ID,
      status: 'true',
    });
}

const FEED_ANSWER: PodcastIndexAnswer = async () =>
  Response.json({
    description: 'Found matching feed',
    feed: { id: Number(FEED_ID), title: 'Podcast Index Show', url: FEED_URL },
    query: { id: FEED_ID },
    status: 'true',
  });

const ENDPOINT_ANSWERS: Record<string, keyof PodcastIndexAnswers> = {
  '/api/1.0/episodes/byid': 'episode',
  '/api/1.0/podcasts/byfeedid': 'feed',
};

function stubPodcastIndex(answers: PodcastIndexAnswers) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input: RequestInfo | URL) => {
      const { pathname } = new URL(String(input));
      const answer = answers[ENDPOINT_ANSWERS[pathname]];

      if (answer === undefined) {
        throw new Error(`The test has no answer for ${pathname}`);
      }

      return answer();
    });
}

function getRequestUrls(fetchSpy: ReturnType<typeof stubPodcastIndex>) {
  return fetchSpy.mock.calls.map(([input]) => new URL(String(input)));
}

function getEpisodeLocation(episodeIdentity: string, query = '') {
  return `https://pod.monster/feeds/${encodeBase64Url(FEED_URL)}/episodes/${encodeBase64Url(episodeIdentity)}${query}`;
}

describe('podcasts episode route', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_KEY', 'test-api-key');
    vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_SECRET', 'test-api-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.mocked(captureMessage).mockClear();
  });

  it('should redirect a known episode id with status 308 to the episode path of the same episode', async () => {
    const fetchSpy = stubPodcastIndex({
      episode: createEpisodeAnswer(),
      feed: FEED_ANSWER,
    });

    const response = await GET(...createEpisodeRequest(FEED_ID, EPISODE_ID));

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(getEpisodeLocation(GUID));

    const [episodeRequestUrl, feedRequestUrl] = getRequestUrls(fetchSpy);

    expect(episodeRequestUrl.pathname).toBe('/api/1.0/episodes/byid');
    expect(episodeRequestUrl.searchParams.get('id')).toBe(EPISODE_ID);
    expect(feedRequestUrl.pathname).toBe('/api/1.0/podcasts/byfeedid');
    expect(feedRequestUrl.searchParams.get('id')).toBe(FEED_ID);
  });

  it('should keep the query string in the Location header', async () => {
    stubPodcastIndex({ episode: createEpisodeAnswer(), feed: FEED_ANSWER });

    const response = await GET(
      ...createEpisodeRequest(FEED_ID, EPISODE_ID, '?t=90'),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      getEpisodeLocation(GUID, '?t=90'),
    );
  });

  it('should use the trimmed guid as the episode identity', async () => {
    stubPodcastIndex({
      episode: createEpisodeAnswer({ guid: `  ${GUID}\n` }),
      feed: FEED_ANSWER,
    });

    const response = await GET(...createEpisodeRequest(FEED_ID, EPISODE_ID));

    expect(response.headers.get('location')).toBe(getEpisodeLocation(GUID));
  });

  it('should use the enclosure URL as the episode identity when the episode has no guid', async () => {
    stubPodcastIndex({
      episode: createEpisodeAnswer({ guid: '' }),
      feed: FEED_ANSWER,
    });

    const response = await GET(...createEpisodeRequest(FEED_ID, EPISODE_ID));

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      getEpisodeLocation(ENCLOSURE_URL),
    );
  });

  it('should look up the feed of the episode, not the feed id of the path', async () => {
    const fetchSpy = stubPodcastIndex({
      episode: createEpisodeAnswer(),
      feed: FEED_ANSWER,
    });

    const response = await GET(...createEpisodeRequest('41504', EPISODE_ID));

    expect(response.status).toBe(308);
    expect(getRequestUrls(fetchSpy)[1].searchParams.get('id')).toBe(FEED_ID);
  });

  it.each([
    { episodeId: EPISODE_ID, feedId: 'abc', name: 'feed id' },
    { episodeId: 'abc', feedId: FEED_ID, name: 'episode id' },
  ])(
    'should answer an $name that is not numeric with 404 and no Podcast Index call',
    async ({ episodeId, feedId }) => {
      const fetchSpy = stubPodcastIndex({
        episode: createEpisodeAnswer(),
        feed: FEED_ANSWER,
      });

      const response = await GET(...createEpisodeRequest(feedId, episodeId));

      expect(response.status).toBe(404);
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it('should answer an episode id that Podcast Index does not know with 404 and no feed call', async () => {
    const fetchSpy = stubPodcastIndex({
      episode: async () =>
        Response.json({
          description: 'No episodes match this id.',
          episode: [],
          id: EPISODE_ID,
          status: 'true',
        }),
      feed: FEED_ANSWER,
    });

    const response = await GET(...createEpisodeRequest(FEED_ID, EPISODE_ID));

    expect(response.status).toBe(404);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('should answer an episode with no guid and no enclosure URL with 404', async () => {
    stubPodcastIndex({
      episode: createEpisodeAnswer({ enclosureUrl: '', guid: '' }),
      feed: FEED_ANSWER,
    });

    const response = await GET(...createEpisodeRequest(FEED_ID, EPISODE_ID));

    expect(response.status).toBe(404);
  });

  it('should answer an episode whose feed Podcast Index does not know with 404', async () => {
    stubPodcastIndex({
      episode: createEpisodeAnswer(),
      feed: async () =>
        Response.json({
          description: 'No feeds match this id.',
          feed: [],
          query: { id: FEED_ID },
          status: 'true',
        }),
    });

    const response = await GET(...createEpisodeRequest(FEED_ID, EPISODE_ID));

    expect(response.status).toBe(404);
  });

  it('should answer a Podcast Index 500 for the episode with 503 and log safe fields only', async () => {
    stubPodcastIndex({
      episode: async () => new Response('Server error', { status: 500 }),
      feed: FEED_ANSWER,
    });

    const response = await GET(...createEpisodeRequest(FEED_ID, EPISODE_ID));

    expect(response.status).toBe(503);
    expect(captureMessage).toHaveBeenCalledWith('podcast_index_unavailable', {
      extra: {
        endpoint: 'episodes/byid',
        reason: 'http_status',
        source: 'podcastIndex',
        status: 500,
      },
      level: 'warning',
    });
  });

  it('should answer a Podcast Index timeout for the feed with 503', async () => {
    stubPodcastIndex({
      episode: createEpisodeAnswer(),
      feed: async () => {
        throw new DOMException('The operation timed out.', 'TimeoutError');
      },
    });

    const response = await GET(...createEpisodeRequest(FEED_ID, EPISODE_ID));

    expect(response.status).toBe(503);
    expect(captureMessage).toHaveBeenCalledWith('podcast_index_unavailable', {
      extra: {
        endpoint: 'podcasts/byfeedid',
        reason: 'timeout',
        source: 'podcastIndex',
        status: undefined,
      },
      level: 'warning',
    });
  });

  it('should answer with 503 and no Podcast Index call when the keys are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_KEY', '');
    const fetchSpy = stubPodcastIndex({
      episode: createEpisodeAnswer(),
      feed: FEED_ANSWER,
    });

    const response = await GET(...createEpisodeRequest(FEED_ID, EPISODE_ID));

    expect(response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(captureMessage).toHaveBeenCalledWith('podcast_index_auth_failed', {
      extra: { reason: 'missing_credentials', source: 'podcastIndex' },
      level: 'error',
    });
  });

  it('should log no feed URL and no guid', async () => {
    stubPodcastIndex({
      episode: createEpisodeAnswer(),
      feed: async () => {
        throw new TypeError(`fetch failed for ${FEED_URL} and ${GUID}`);
      },
    });

    await GET(...createEpisodeRequest(FEED_ID, EPISODE_ID));

    const loggedText = JSON.stringify(vi.mocked(captureMessage).mock.calls);

    expect(captureMessage).toHaveBeenCalledOnce();
    expect(loggedText).toContain('"reason":"network"');
    expect(loggedText).not.toContain(FEED_URL);
    expect(loggedText).not.toContain(GUID);
  });
});

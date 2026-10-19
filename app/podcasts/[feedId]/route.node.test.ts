import { captureMessage } from '@sentry/nextjs';

import { encodeBase64Url } from 'utils/base64Url';

import { GET } from './route';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const FEED_ID = '920666';
const FEED_URL = 'https://example.com/feed.xml';

function createShowRequest(feedId: string, query = '') {
  return [
    new Request(`https://pod.monster/podcasts/${feedId}${query}`),
    { params: Promise.resolve({ feedId }) },
  ] as const;
}

function stubPodcastIndex(answer: () => Promise<Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(answer);
}

function answerWithFeed() {
  return stubPodcastIndex(async () =>
    Response.json({
      description: 'Found matching feed',
      feed: { id: Number(FEED_ID), title: 'Podcast Index Show', url: FEED_URL },
      query: { id: FEED_ID },
      status: 'true',
    }),
  );
}

describe('podcasts show route', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_KEY', 'test-api-key');
    vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_SECRET', 'test-api-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.mocked(captureMessage).mockClear();
  });

  it('should redirect a known feed id with status 308 to the show path of its feed URL', async () => {
    const fetchSpy = answerWithFeed();

    const response = await GET(...createShowRequest(FEED_ID));

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      `https://pod.monster/feeds/${encodeBase64Url(FEED_URL)}`,
    );
    expect(fetchSpy).toHaveBeenCalledOnce();

    const requestUrl = new URL(String(fetchSpy.mock.calls[0][0]));

    expect(requestUrl.pathname).toBe('/api/1.0/podcasts/byfeedid');
    expect(requestUrl.searchParams.get('id')).toBe(FEED_ID);
  });

  it('should keep the query string in the Location header', async () => {
    answerWithFeed();

    const response = await GET(...createShowRequest(FEED_ID, '?t=90'));

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      `https://pod.monster/feeds/${encodeBase64Url(FEED_URL)}?t=90`,
    );
  });

  it('should answer a feed id that is not numeric with 404 and no Podcast Index call', async () => {
    const fetchSpy = answerWithFeed();

    const response = await GET(...createShowRequest('abc'));

    expect(response.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([
    { feed: [], name: 'an array' },
    { feed: {}, name: 'an empty object' },
  ])(
    'should answer a feed id that Podcast Index does not know, with $name as the feed, with 404',
    async ({ feed }) => {
      stubPodcastIndex(async () =>
        Response.json({
          description: 'No feeds match this id.',
          feed,
          query: { id: FEED_ID },
          status: 'true',
        }),
      );

      const response = await GET(...createShowRequest(FEED_ID));

      expect(response.status).toBe(404);
    },
  );

  it('should answer a Podcast Index status other than "true" with 404', async () => {
    stubPodcastIndex(async () =>
      Response.json({
        description: 'Not found',
        feed: { id: Number(FEED_ID), url: FEED_URL },
        status: 'false',
      }),
    );

    const response = await GET(...createShowRequest(FEED_ID));

    expect(response.status).toBe(404);
  });

  it('should answer a Podcast Index 500 with 503 and log safe fields only', async () => {
    stubPodcastIndex(async () => new Response('Server error', { status: 500 }));

    const response = await GET(...createShowRequest(FEED_ID));

    expect(response.status).toBe(503);
    expect(captureMessage).toHaveBeenCalledWith('podcast_index_unavailable', {
      extra: {
        endpoint: 'podcasts/byfeedid',
        reason: 'http_status',
        source: 'podcastIndex',
        status: 500,
      },
      level: 'warning',
    });
  });

  it('should answer a Podcast Index timeout with 503', async () => {
    stubPodcastIndex(async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });

    const response = await GET(...createShowRequest(FEED_ID));

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

  it('should answer a Podcast Index 401 with 503 and log a configuration error', async () => {
    stubPodcastIndex(async () => new Response('Unauthorized', { status: 401 }));

    const response = await GET(...createShowRequest(FEED_ID));

    expect(response.status).toBe(503);
    expect(captureMessage).toHaveBeenCalledWith('podcast_index_auth_failed', {
      extra: {
        endpoint: 'podcasts/byfeedid',
        reason: 'http_status',
        source: 'podcastIndex',
        status: 401,
      },
      level: 'error',
    });
  });

  it('should answer with 503 and no Podcast Index call when the keys are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_SECRET', '');
    const fetchSpy = answerWithFeed();

    const response = await GET(...createShowRequest(FEED_ID));

    expect(response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(captureMessage).toHaveBeenCalledWith('podcast_index_auth_failed', {
      extra: { reason: 'missing_credentials', source: 'podcastIndex' },
      level: 'error',
    });
  });

  it('should log no part of the feed URL', async () => {
    stubPodcastIndex(async () => {
      throw new TypeError(`fetch failed for ${FEED_URL}`);
    });

    await GET(...createShowRequest(FEED_ID));

    const loggedText = JSON.stringify(vi.mocked(captureMessage).mock.calls);

    expect(captureMessage).toHaveBeenCalledOnce();
    expect(loggedText).toContain('"reason":"network"');
    expect(loggedText).not.toContain(FEED_URL);
  });
});

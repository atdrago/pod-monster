import { captureMessage } from '@sentry/nextjs';
import { NextRequest } from 'next/server';

import { POST } from './route';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const FEED_URL = 'https://example.com/feed.xml?format=mp3&quality=high';
const PATREON_FEED_URL =
  'https://www.patreon.com/rss/example?auth=Secret123&show=456';
const PODCAST_INDEX_FEED_ID = 920666;

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function createOpml(outlines: Array<{ title: string; xmlUrl: string }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>Subscriptions</title>
  </head>
  <body>
    ${outlines
      .map(
        ({ title, xmlUrl }) =>
          `<outline text="${escapeXml(title)}" title="${escapeXml(title)}" type="rss" xmlUrl="${escapeXml(xmlUrl)}"/>`,
      )
      .join('\n    ')}
  </body>
</opml>`;
}

/** The settings page sends the file as form data. */
function createImportRequest(opml: string) {
  const body = new FormData();

  body.append(
    'opml',
    new File([opml], 'podmonster.opml', { type: 'text/xml' }),
  );

  return new NextRequest('https://pod.monster/api/settings/opml/import', {
    body,
    method: 'POST',
  });
}

function stubPodcastIndex(answer: () => Promise<Response>) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input: RequestInfo | URL) => {
      const requestUrl = new URL(String(input));

      if (
        requestUrl.origin !== 'https://api.podcastindex.org' ||
        requestUrl.pathname !== '/api/1.0/podcasts/byfeedurl'
      ) {
        throw new Error(`The test has no answer for ${requestUrl.pathname}`);
      }

      return answer();
    });
}

const PODCAST_INDEX_FEED_HIT = async () =>
  Response.json({
    description: 'Found matching feed',
    feed: {
      id: PODCAST_INDEX_FEED_ID,
      image: 'https://example.com/image.jpg',
      link: 'https://example.com/show',
      title: 'Podcast Index Show',
      type: 0,
      url: 'https://cdn.example.com/canonical-feed.xml',
    },
    status: 'true',
  });

function expectNoFeedUrlInLogs(...feedUrls: Array<string>) {
  const loggedText = JSON.stringify(vi.mocked(captureMessage).mock.calls);

  for (const feedUrl of feedUrls) {
    expect(loggedText).not.toContain(feedUrl);
    expect(loggedText).not.toContain(new URL(feedUrl).host);
  }
}

describe('OPML import route', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_KEY', 'test-api-key');
    vi.stubEnv('NEXT_PUBLIC_PODCAST_INDEX_API_SECRET', 'test-api-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.mocked(captureMessage).mockClear();
  });

  it('should make no Podcast Index call for a Patreon feed URL, and report it as not imported', async () => {
    const fetchSpy = stubPodcastIndex(PODCAST_INDEX_FEED_HIT);

    const response = await POST(
      createImportRequest(
        createOpml([{ title: 'Member Show', xmlUrl: PATREON_FEED_URL }]),
      ),
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      errors: [{ feedUrl: PATREON_FEED_URL, title: 'Member Show' }],
      feedSettings: {},
    });
    expectNoFeedUrlInLogs(PATREON_FEED_URL);
  });

  it.each([
    { name: 'not a URL', xmlUrl: 'not a feed url' },
    { name: 'not an http URL', xmlUrl: 'ftp://example.com/feed.xml' },
  ])(
    'should make no Podcast Index call for an xmlUrl that is $name, and report it as not imported',
    async ({ xmlUrl }) => {
      const fetchSpy = stubPodcastIndex(PODCAST_INDEX_FEED_HIT);

      const response = await POST(
        createImportRequest(createOpml([{ title: 'OPML Show', xmlUrl }])),
      );

      expect(fetchSpy).not.toHaveBeenCalled();
      await expect(response.json()).resolves.toEqual({
        errors: [{ feedUrl: xmlUrl, title: 'OPML Show' }],
        feedSettings: {},
      });
    },
  );

  it('should key a feed that Podcast Index knows by the OPML xmlurl, with the Podcast Index feed id as a value', async () => {
    const fetchSpy = stubPodcastIndex(PODCAST_INDEX_FEED_HIT);

    const response = await POST(
      createImportRequest(
        createOpml([{ title: 'OPML Show', xmlUrl: FEED_URL }]),
      ),
    );
    const responseJson = await response.json();

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(
      new URL(String(fetchSpy.mock.calls[0][0])).searchParams.get('url'),
    ).toBe(FEED_URL);
    expect(responseJson).toEqual({
      errors: [],
      feedSettings: {
        [FEED_URL]: {
          htmlUrl: 'https://example.com/show',
          image: 'https://example.com/image.jpg',
          podcastIndexId: PODCAST_INDEX_FEED_ID,
          subscribedAt: expect.any(String),
          title: 'Podcast Index Show',
          type: 'rss',
        },
      },
    });
    expect(
      Date.parse(responseJson.feedSettings[FEED_URL].subscribedAt),
    ).not.toBe(NaN);
  });

  it('should import the feeds that Podcast Index knows and report the rest, in one file', async () => {
    stubPodcastIndex(PODCAST_INDEX_FEED_HIT);

    const response = await POST(
      createImportRequest(
        createOpml([
          { title: 'OPML Show', xmlUrl: FEED_URL },
          { title: 'Member Show', xmlUrl: PATREON_FEED_URL },
        ]),
      ),
    );
    const responseJson = await response.json();

    expect(Object.keys(responseJson.feedSettings)).toEqual([FEED_URL]);
    expect(responseJson.errors).toEqual([
      { feedUrl: PATREON_FEED_URL, title: 'Member Show' },
    ]);
  });

  it('should report a feed that Podcast Index does not know as not imported', async () => {
    stubPodcastIndex(async () =>
      Response.json({
        description: 'No feeds match this url.',
        feed: [],
        status: 'true',
      }),
    );

    const response = await POST(
      createImportRequest(
        createOpml([{ title: 'OPML Show', xmlUrl: FEED_URL }]),
      ),
    );

    await expect(response.json()).resolves.toEqual({
      errors: [{ feedUrl: FEED_URL, title: 'OPML Show' }],
      feedSettings: {},
    });
  });

  it('should report a feed as not imported, and log no feed URL, when the Podcast Index call fails', async () => {
    stubPodcastIndex(async () => new Response('Server error', { status: 500 }));

    const response = await POST(
      createImportRequest(
        createOpml([{ title: 'OPML Show', xmlUrl: FEED_URL }]),
      ),
    );

    await expect(response.json()).resolves.toEqual({
      errors: [{ feedUrl: FEED_URL, title: 'OPML Show' }],
      feedSettings: {},
    });
    expect(captureMessage).toHaveBeenCalledWith(
      'podcast_index_unavailable',
      expect.objectContaining({
        extra: expect.objectContaining({
          endpoint: 'podcasts/byfeedurl',
          status: 500,
        }),
        level: 'warning',
      }),
    );
    expectNoFeedUrlInLogs(FEED_URL);
  });

  it('should log a Podcast Index 401 as an auth failure at level error, and report the feed as not imported', async () => {
    stubPodcastIndex(async () => new Response('Unauthorized', { status: 401 }));

    const response = await POST(
      createImportRequest(
        createOpml([{ title: 'OPML Show', xmlUrl: FEED_URL }]),
      ),
    );

    await expect(response.json()).resolves.toEqual({
      errors: [{ feedUrl: FEED_URL, title: 'OPML Show' }],
      feedSettings: {},
    });
    expect(captureMessage).toHaveBeenCalledWith(
      'podcast_index_auth_failed',
      expect.objectContaining({
        extra: expect.objectContaining({
          endpoint: 'podcasts/byfeedurl',
          status: 401,
        }),
        level: 'error',
      }),
    );
    expectNoFeedUrlInLogs(FEED_URL);
  });

  it('should answer a file that is not OPML with status 400, and log the failure', async () => {
    const fetchSpy = stubPodcastIndex(PODCAST_INDEX_FEED_HIT);

    const response = await POST(
      createImportRequest('<opml><body><outline text="Unclosed"'),
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(captureMessage).toHaveBeenCalledWith(
      'opml_import_parse_failed',
      expect.anything(),
    );
  });
});

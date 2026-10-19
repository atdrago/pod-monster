import { captureMessage } from '@sentry/nextjs';
import { NextRequest } from 'next/server';

import { safeFetchFeedResource } from 'utils/server/safeFetchFeed';

import { GET } from './route';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// The real guard runs by default, so a blocked URL opens no connection. A test
// that needs an answer from a target gives the guard result directly.
vi.mock('utils/server/safeFetchFeed', async (importOriginal) => {
  const guard =
    await importOriginal<typeof import('utils/server/safeFetchFeed')>();

  return {
    ...guard,
    safeFetchFeedResource: vi.fn(guard.safeFetchFeedResource),
  };
});

const PUBLIC_CHAPTERS_URL = 'https://example.com/chapters.json';
const PRIVATE_CHAPTERS_URL =
  'https://example.com/chapters.json?auth=member-secret';
const PUBLIC_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=3600';

function createChaptersRequest(chaptersUrl?: string) {
  const requestUrl = new URL('https://pod.monster/api/podcasts/chapters');

  if (chaptersUrl !== undefined) {
    requestUrl.searchParams.set('url', chaptersUrl);
  }

  return new NextRequest(requestUrl);
}

function answerWithBody(body: string) {
  vi.mocked(safeFetchFeedResource).mockResolvedValueOnce({ body, kind: 'ok' });
}

describe('chapters route', () => {
  afterEach(() => {
    vi.mocked(captureMessage).mockClear();
    vi.mocked(safeFetchFeedResource).mockClear();
  });

  it('should answer a loopback URL with the fixed blocked code and no stack', async () => {
    const response = await GET(
      createChaptersRequest('http://127.0.0.1/chapters.json'),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'blocked' },
    });
  });

  it('should answer a private target URL with Cache-Control: private, no-store', async () => {
    answerWithBody(JSON.stringify({ chapters: [{ startTime: 0 }] }));

    const response = await GET(createChaptersRequest(PRIVATE_CHAPTERS_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('should send Cache-Control: private, no-store on an error for a private target URL', async () => {
    vi.mocked(safeFetchFeedResource).mockResolvedValueOnce({
      kind: 'error',
      reason: 'http_status',
      status: 404,
    });

    const response = await GET(createChaptersRequest(PRIVATE_CHAPTERS_URL));

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('should answer a public target URL with the chapters sorted by start time and the public cache header', async () => {
    answerWithBody(
      JSON.stringify({
        chapters: [
          { startTime: 120, title: 'Second' },
          { title: 'No start time' },
          { img: null, startTime: 0, title: 'First', toc: true },
        ],
        version: '1.2.0',
      }),
    );

    const response = await GET(createChaptersRequest(PUBLIC_CHAPTERS_URL));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(PUBLIC_CACHE_CONTROL);
    await expect(response.json()).resolves.toEqual([
      { img: null, startTime: 0, title: 'First', toc: true },
      { startTime: 120, title: 'Second' },
    ]);
    expect(safeFetchFeedResource).toHaveBeenCalledWith(PUBLIC_CHAPTERS_URL);
  });

  it('should drop a chapter with a field of the wrong type', async () => {
    answerWithBody(
      JSON.stringify({
        chapters: [
          { startTime: '5', title: 'Text start time' },
          { startTime: 10, title: 42 },
          { startTime: 20, title: 'Valid' },
        ],
      }),
    );

    const response = await GET(createChaptersRequest(PUBLIC_CHAPTERS_URL));

    await expect(response.json()).resolves.toEqual([
      { startTime: 20, title: 'Valid' },
    ]);
  });

  it('should answer a request with no url with the fixed missing_url code', async () => {
    const response = await GET(createChaptersRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'missing_url' },
    });
    expect(safeFetchFeedResource).not.toHaveBeenCalled();
  });

  it('should answer a body that is not JSON with invalid_body, and log an event with no body text', async () => {
    answerWithBody('<html>member-secret</html>');

    const response = await GET(createChaptersRequest(PUBLIC_CHAPTERS_URL));

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBeNull();
    await expect(response.json()).resolves.toEqual({
      error: { code: 'invalid_body' },
    });
    expect(captureMessage).toHaveBeenCalledWith('chapters_proxy_invalid_body', {
      extra: { reason: 'invalid_json' },
      level: 'warning',
    });
  });

  it('should answer a JSON body with no chapters array with invalid_body, and log an event', async () => {
    answerWithBody(JSON.stringify({ chapters: 'none' }));

    const response = await GET(createChaptersRequest(PUBLIC_CHAPTERS_URL));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'invalid_body' },
    });
    expect(captureMessage).toHaveBeenCalledWith('chapters_proxy_invalid_body', {
      extra: { reason: 'invalid_shape' },
      level: 'warning',
    });
  });

  it('should answer a guard timeout with status 504 and the fixed timeout code', async () => {
    vi.mocked(safeFetchFeedResource).mockResolvedValueOnce({
      kind: 'error',
      reason: 'timeout',
    });

    const response = await GET(createChaptersRequest(PUBLIC_CHAPTERS_URL));

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'timeout' },
    });
  });
});

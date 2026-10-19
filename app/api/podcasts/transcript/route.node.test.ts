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

const PUBLIC_TRANSCRIPT_URL = 'https://example.com/transcript.vtt';
const PRIVATE_TRANSCRIPT_URL =
  'https://example.com/transcript.vtt?auth=member-secret';
const PUBLIC_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=3600';
const VTT_BODY = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.500\nHello\n\n';

function createTranscriptRequest(
  parameters: Partial<Record<'duration' | 'type' | 'url', string>>,
) {
  const requestUrl = new URL('https://pod.monster/api/podcasts/transcript');

  for (const [name, value] of Object.entries(parameters)) {
    requestUrl.searchParams.set(name, value);
  }

  return new NextRequest(requestUrl);
}

function answerWithBody(body: string) {
  vi.mocked(safeFetchFeedResource).mockResolvedValueOnce({ body, kind: 'ok' });
}

describe('transcript route', () => {
  afterEach(() => {
    vi.mocked(captureMessage).mockClear();
    vi.mocked(safeFetchFeedResource).mockClear();
  });

  it('should answer an HTML request for a loopback URL with the fixed blocked code and no body from the target', async () => {
    const response = await GET(
      createTranscriptRequest({
        type: 'text/html',
        url: 'http://127.0.0.1/transcript.html',
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'blocked' },
    });
  });

  it('should answer a VTT transcript with its cues in seconds and the public cache header', async () => {
    answerWithBody(VTT_BODY);

    const response = await GET(
      createTranscriptRequest({
        type: 'text/vtt',
        url: PUBLIC_TRANSCRIPT_URL,
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe(PUBLIC_CACHE_CONTROL);
    await expect(response.json()).resolves.toEqual({
      content: [{ from: 1, id: '', text: 'Hello', to: 2.5 }],
      type: 'text/vtt',
    });
    expect(safeFetchFeedResource).toHaveBeenCalledWith(PUBLIC_TRANSCRIPT_URL);
  });

  it('should convert an HTML transcript with timestamps to VTT cues', async () => {
    answerWithBody('<p>[00:00:01] Hello</p><p>[00:00:03] World</p>');

    const response = await GET(
      createTranscriptRequest({
        duration: '5',
        type: 'text/html',
        url: 'https://example.com/transcript.html',
      }),
    );

    await expect(response.json()).resolves.toEqual({
      content: [
        { from: 1, id: '', text: 'Hello', to: 3 },
        { from: 3, id: '', text: 'World', to: 5 },
      ],
      type: 'text/vtt',
    });
  });

  it('should answer an HTML transcript with no timestamps with its HTML', async () => {
    answerWithBody('<p>Hello</p>');

    const response = await GET(
      createTranscriptRequest({
        type: 'text/html',
        url: 'https://example.com/transcript.html',
      }),
    );

    expect(response.headers.get('cache-control')).toBe(PUBLIC_CACHE_CONTROL);
    await expect(response.json()).resolves.toEqual({
      content: '<p>Hello</p>',
      type: 'text/html',
    });
  });

  it('should answer a private target URL with Cache-Control: private, no-store', async () => {
    answerWithBody(VTT_BODY);

    const response = await GET(
      createTranscriptRequest({
        type: 'text/vtt',
        url: PRIVATE_TRANSCRIPT_URL,
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('should answer a transcript that does not parse with invalid_body, and log an event with no body text', async () => {
    answerWithBody('member-secret');

    const response = await GET(
      createTranscriptRequest({
        type: 'text/vtt',
        url: PRIVATE_TRANSCRIPT_URL,
      }),
    );

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    await expect(response.json()).resolves.toEqual({
      error: { code: 'invalid_body' },
    });
    expect(captureMessage).toHaveBeenCalledWith(
      'transcript_proxy_parse_failed',
      { extra: { type: 'text/vtt' }, level: 'warning' },
    );
  });

  it('should answer a guard failure with status 502 and the fixed code of the reason', async () => {
    vi.mocked(safeFetchFeedResource).mockResolvedValueOnce({
      kind: 'error',
      reason: 'too_large',
      status: 200,
    });

    const response = await GET(
      createTranscriptRequest({
        type: 'text/vtt',
        url: PUBLIC_TRANSCRIPT_URL,
      }),
    );

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBeNull();
    await expect(response.json()).resolves.toEqual({
      error: { code: 'too_large' },
    });
  });

  it('should answer a request with no url with the fixed missing_url code', async () => {
    const response = await GET(createTranscriptRequest({ type: 'text/vtt' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'missing_url' },
    });
  });

  it('should answer a request with no type with the fixed missing_type code', async () => {
    const response = await GET(
      createTranscriptRequest({ url: PUBLIC_TRANSCRIPT_URL }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'missing_type' },
    });
  });

  it('should answer an unsupported type with status 501 and no fetch', async () => {
    const response = await GET(
      createTranscriptRequest({
        type: 'application/json',
        url: PUBLIC_TRANSCRIPT_URL,
      }),
    );

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'unsupported_type' },
    });
    expect(safeFetchFeedResource).not.toHaveBeenCalled();
  });
});

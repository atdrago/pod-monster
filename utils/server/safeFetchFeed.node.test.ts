import { captureMessage } from '@sentry/nextjs';
import { Resolver } from 'node:dns/promises';
import net from 'node:net';
import tls from 'node:tls';

import {
  type DnsLookup,
  pinLookup,
  safeFetchByteRange,
  safeFetchFeed,
  safeFetchFeedResource,
} from './safeFetchFeed';

vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }));

const MEBIBYTE = 1024 * 1024;
const FEED_URL = 'https://example.com/feed.xml';
const PUBLIC_IPV4 = '93.184.215.14';

type FakeResponse =
  | { body?: BodyInit | null; headers?: Record<string, string>; status: number }
  | { throwError: Error };

interface RecordedCall {
  headers: Headers;
  url: string;
}

function createFakeFetch(responses: Array<FakeResponse>) {
  const queue = [...responses];
  const calls: Array<RecordedCall> = [];
  const fetchFn = vi.fn(
    async (input: string, init?: RequestInit): Promise<Response> => {
      calls.push({ headers: new Headers(init?.headers), url: input });

      const next = queue.shift();

      if (!next) {
        throw new Error('No fake response is in the queue');
      }

      if ('throwError' in next) {
        throw next.throwError;
      }

      return new Response(next.body ?? null, {
        headers: next.headers,
        status: next.status,
      });
    },
  );

  return { calls, fetchFn };
}

function createFetchThatMustNotRun() {
  return vi.fn(async (): Promise<Response> => {
    throw new Error('The fetch must not run');
  });
}

function createFetchThatNeverAnswers() {
  return vi.fn(
    (_input: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason);
        });
      }),
  );
}

const publicDnsLookup: DnsLookup = async () => [
  { address: PUBLIC_IPV4, family: 4 },
];

function createDnsLookupFor(address: string, family: number): DnsLookup {
  return async () => [{ address, family }];
}

// Node runs `AbortSignal.timeout` on internal timers, and fake timers do not
// replace them. This stub runs the same deadline on the global timers.
function stubTimeoutSignalOnFakeTimers() {
  vi.useFakeTimers();
  vi.spyOn(AbortSignal, 'timeout').mockImplementation((milliseconds) => {
    const controller = new AbortController();

    setTimeout(() => {
      controller.abort(
        new DOMException('The operation timed out.', 'TimeoutError'),
      );
    }, milliseconds);

    return controller.signal;
  });
}

function createStreamOfMebibytes() {
  const counter = { pulledChunkCount: 0 };
  const cancel = vi.fn();
  const body = new ReadableStream<Uint8Array>(
    {
      cancel,
      pull(controller) {
        counter.pulledChunkCount += 1;
        controller.enqueue(new Uint8Array(MEBIBYTE));
      },
    },
    { highWaterMark: 0 },
  );

  return { body, cancel, counter };
}

function createChunkedStream(bytes: Uint8Array, chunkSize: number) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
        controller.enqueue(bytes.slice(offset, offset + chunkSize));
      }

      controller.close();
    },
  });
}

describe('safeFetchFeed', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.mocked(captureMessage).mockClear();
  });

  it('should return the body text of a public 200 answer', async () => {
    const { calls, fetchFn } = createFakeFetch([
      { body: '<rss version="2.0"></rss>', status: 200 },
    ]);

    const result = await safeFetchFeed(FEED_URL, {
      dnsLookup: publicDnsLookup,
      fetchFn,
    });

    expect(result).toEqual({ body: '<rss version="2.0"></rss>', kind: 'ok' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(FEED_URL);
  });

  it('should send only a fixed User-Agent and an Accept header', async () => {
    const { calls, fetchFn } = createFakeFetch([{ body: '', status: 200 }]);

    await safeFetchFeed(FEED_URL, { dnsLookup: publicDnsLookup, fetchFn });

    expect(Array.from(calls[0].headers.keys()).sort()).toEqual([
      'accept',
      'user-agent',
    ]);
    expect(calls[0].headers.get('user-agent')).toBe(
      'pod.monster (+https://pod.monster)',
    );
  });

  describe('blocked addresses', () => {
    it.each<[string, number]>([
      ['0.0.0.0', 4],
      ['10.0.0.1', 4],
      ['100.64.0.1', 4],
      ['127.0.0.1', 4],
      ['169.254.169.254', 4],
      ['172.16.0.1', 4],
      ['192.0.0.1', 4],
      ['192.0.2.1', 4],
      ['192.88.99.1', 4],
      ['192.168.1.1', 4],
      ['198.18.0.1', 4],
      ['198.51.100.1', 4],
      ['203.0.113.1', 4],
      ['224.0.0.1', 4],
      ['240.0.0.1', 4],
      ['255.255.255.255', 4],
      ['::', 6],
      ['::1', 6],
      ['::ffff:127.0.0.1', 6],
      ['::ffff:7f00:1', 6],
      ['::7f00:1', 6],
      ['64:ff9b::7f00:1', 6],
      ['2001::1', 6],
      ['2001:db8::1', 6],
      ['2002:7f00:1::', 6],
      ['fe80::1', 6],
      ['fec0::1', 6],
      ['fc00::1', 6],
      ['ff02::1', 6],
    ])(
      'should give blocked when the resolver returns %s, and open no connection',
      async (address, family) => {
        const fetchFn = createFetchThatMustNotRun();

        const result = await safeFetchFeed(FEED_URL, {
          dnsLookup: createDnsLookupFor(address, family),
          fetchFn,
        });

        expect(result).toEqual({ kind: 'error', reason: 'blocked' });
        expect(fetchFn).not.toHaveBeenCalled();
      },
    );

    it('should give blocked when one of several resolved addresses is private', async () => {
      const fetchFn = createFetchThatMustNotRun();

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: async () => [
          { address: PUBLIC_IPV4, family: 4 },
          { address: '10.0.0.1', family: 4 },
        ],
        fetchFn,
      });

      expect(result).toEqual({ kind: 'error', reason: 'blocked' });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it.each([
      'http://127.0.0.1/feed.xml',
      'http://0x7f.1/feed.xml',
      'http://169.254.169.254/latest/meta-data/',
      'http://[::1]/feed.xml',
      'http://[::ffff:7f00:1]/feed.xml',
      'http://[64:ff9b::a9fe:a9fe]/feed.xml',
    ])(
      'should give blocked for the literal address URL %s with no DNS lookup',
      async (url) => {
        const dnsLookup = vi.fn(publicDnsLookup);
        const fetchFn = createFetchThatMustNotRun();

        const result = await safeFetchFeed(url, { dnsLookup, fetchFn });

        expect(result).toEqual({ kind: 'error', reason: 'blocked' });
        expect(dnsLookup).not.toHaveBeenCalled();
        expect(fetchFn).not.toHaveBeenCalled();
      },
    );
  });

  describe('allowed addresses', () => {
    it.each<[string, number]>([
      [PUBLIC_IPV4, 4],
      ['2606:4700:4700::1111', 6],
      ['::ffff:93.184.215.14', 6],
    ])(
      'should fetch when the resolver returns the public address %s',
      async (address, family) => {
        const { fetchFn } = createFakeFetch([{ body: 'ok', status: 200 }]);

        const result = await safeFetchFeed(FEED_URL, {
          dnsLookup: createDnsLookupFor(address, family),
          fetchFn,
        });

        expect(result).toEqual({ body: 'ok', kind: 'ok' });
      },
    );

    it('should fetch a public IPv6 literal URL', async () => {
      const { fetchFn } = createFakeFetch([{ body: 'ok', status: 200 }]);

      const result = await safeFetchFeed(
        'http://[2606:4700:4700::1111]/feed.xml',
        { fetchFn },
      );

      expect(result).toEqual({ body: 'ok', kind: 'ok' });
    });

    it('should resolve the host again on each call', async () => {
      let lookupCount = 0;

      const dnsLookup: DnsLookup = async () => {
        lookupCount += 1;

        return lookupCount === 1
          ? [{ address: PUBLIC_IPV4, family: 4 }]
          : [{ address: '10.0.0.5', family: 4 }];
      };

      const { fetchFn } = createFakeFetch([{ body: 'ok', status: 200 }]);

      const first = await safeFetchFeed(FEED_URL, { dnsLookup, fetchFn });
      const second = await safeFetchFeed(FEED_URL, {
        dnsLookup,
        fetchFn: createFetchThatMustNotRun(),
      });

      expect(first.kind).toBe('ok');
      expect(second).toEqual({ kind: 'error', reason: 'blocked' });
      expect(lookupCount).toBe(2);
    });
  });

  describe('URL rules', () => {
    it.each([
      'file:///etc/passwd',
      'ftp://example.com/feed.xml',
      'https://user:pass@example.com/feed',
      'https://user@example.com/feed',
      'not a url',
      `https://example.com/${'a'.repeat(2100)}`,
    ])('should give blocked for %s without a fetch', async (url) => {
      const fetchFn = createFetchThatMustNotRun();

      const result = await safeFetchFeed(url, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({ kind: 'error', reason: 'blocked' });
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });

  describe('redirects', () => {
    it('should follow a public redirect and return the destination body', async () => {
      const { calls, fetchFn } = createFakeFetch([
        { headers: { location: '/new.xml' }, status: 301 },
        { body: 'moved', status: 200 },
      ]);

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({ body: 'moved', kind: 'ok' });
      expect(calls[1].url).toBe('https://example.com/new.xml');
    });

    it('should give blocked when a public address redirects to 127.0.0.1', async () => {
      const { calls, fetchFn } = createFakeFetch([
        { headers: { location: 'http://127.0.0.1/feed.xml' }, status: 302 },
        { body: 'internal', status: 200 },
      ]);

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({ kind: 'error', reason: 'blocked' });
      expect(calls).toHaveLength(1);
    });

    it('should give blocked when a redirect host resolves to a private address', async () => {
      const dnsLookup: DnsLookup = async (hostname) =>
        hostname === 'internal.example.com'
          ? [{ address: '10.0.0.1', family: 4 }]
          : [{ address: PUBLIC_IPV4, family: 4 }];
      const { calls, fetchFn } = createFakeFetch([
        {
          headers: { location: 'https://internal.example.com/feed.xml' },
          status: 307,
        },
      ]);

      const result = await safeFetchFeed(FEED_URL, { dnsLookup, fetchFn });

      expect(result).toEqual({ kind: 'error', reason: 'blocked' });
      expect(calls).toHaveLength(1);
    });

    it('should follow a chain of five redirects', async () => {
      const { calls, fetchFn } = createFakeFetch([
        { headers: { location: '/2' }, status: 301 },
        { headers: { location: '/3' }, status: 302 },
        { headers: { location: '/4' }, status: 303 },
        { headers: { location: '/5' }, status: 307 },
        { headers: { location: '/6' }, status: 308 },
        { body: 'end', status: 200 },
      ]);

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({ body: 'end', kind: 'ok' });
      expect(calls).toHaveLength(6);
    });

    it('should give blocked for a chain of six redirects', async () => {
      const { calls, fetchFn } = createFakeFetch([
        { headers: { location: '/2' }, status: 301 },
        { headers: { location: '/3' }, status: 301 },
        { headers: { location: '/4' }, status: 301 },
        { headers: { location: '/5' }, status: 301 },
        { headers: { location: '/6' }, status: 301 },
        { headers: { location: '/7' }, status: 301 },
        { body: 'end', status: 200 },
      ]);

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({ kind: 'error', reason: 'blocked' });
      expect(calls).toHaveLength(6);
    });

    it('should give network for a redirect with no Location header', async () => {
      const { fetchFn } = createFakeFetch([{ status: 302 }]);

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({ kind: 'error', reason: 'network', status: 302 });
    });

    it('should give http_status for a 304 answer, which is not a redirect', async () => {
      const { calls, fetchFn } = createFakeFetch([{ status: 304 }]);

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({
        kind: 'error',
        reason: 'http_status',
        status: 304,
      });
      expect(calls).toHaveLength(1);
    });
  });

  describe('size caps', () => {
    it('should give too_large for a content-length of 11 MiB with no body read', async () => {
      const pull = vi.fn();
      const cancel = vi.fn();
      const body = new ReadableStream<Uint8Array>(
        { cancel, pull },
        { highWaterMark: 0 },
      );
      const { fetchFn } = createFakeFetch([
        {
          body,
          headers: { 'content-length': String(11 * MEBIBYTE) },
          status: 200,
        },
      ]);

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({
        kind: 'error',
        reason: 'too_large',
        status: 200,
      });
      expect(pull).not.toHaveBeenCalled();
      expect(cancel).toHaveBeenCalled();
    });

    it('should give too_large for a body over 10 MiB with no content-length, and stop the stream at the cap', async () => {
      const { body, cancel, counter } = createStreamOfMebibytes();
      const { fetchFn } = createFakeFetch([{ body, status: 200 }]);

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({
        kind: 'error',
        reason: 'too_large',
        status: 200,
      });
      expect(counter.pulledChunkCount).toBeLessThanOrEqual(11);
      expect(cancel).toHaveBeenCalled();
    });
  });

  describe('timeouts', () => {
    it('should give timeout when the resolver does not answer', async () => {
      vi.useFakeTimers();

      const fetchFn = createFetchThatMustNotRun();
      const pending = safeFetchFeed(FEED_URL, {
        dnsLookup: () => new Promise<never>(() => {}),
        fetchFn,
      });

      await vi.advanceTimersByTimeAsync(10_000);

      await expect(pending).resolves.toEqual({
        kind: 'error',
        reason: 'timeout',
      });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('should give timeout when the server does not answer within 20 seconds', async () => {
      stubTimeoutSignalOnFakeTimers();

      let result: unknown;
      const pending = safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn: createFetchThatNeverAnswers(),
      }).then((value) => {
        result = value;
      });

      await vi.advanceTimersByTimeAsync(19_999);

      expect(result).toBeUndefined();

      await vi.advanceTimersByTimeAsync(1);
      await pending;

      expect(result).toEqual({ kind: 'error', reason: 'timeout' });
    });

    it('should give timeout when the body stops before the end', async () => {
      stubTimeoutSignalOnFakeTimers();

      const fetchFn = vi.fn(async (_input: string, init?: RequestInit) => {
        const signal = init?.signal;
        const body = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('<rss>'));
            signal?.addEventListener('abort', () => {
              controller.error(signal.reason);
            });
          },
        });

        return new Response(body, { status: 200 });
      });
      const pending = safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      await vi.advanceTimersByTimeAsync(20_000);

      await expect(pending).resolves.toEqual({
        kind: 'error',
        reason: 'timeout',
        status: 200,
      });
    });

    it('should give timeout when the fetch throws a TimeoutError', async () => {
      const timeoutError = new Error('timeout');

      timeoutError.name = 'TimeoutError';

      const { fetchFn } = createFakeFetch([{ throwError: timeoutError }]);

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({ kind: 'error', reason: 'timeout' });
    });
  });

  describe('answers', () => {
    it.each([404, 410, 429, 500, 503])(
      'should give http_status with the status %i',
      async (status) => {
        const { fetchFn } = createFakeFetch([{ body: 'error', status }]);

        const result = await safeFetchFeed(FEED_URL, {
          dnsLookup: publicDnsLookup,
          fetchFn,
        });

        expect(result).toEqual({
          kind: 'error',
          reason: 'http_status',
          status,
        });
      },
    );

    it('should give network when the fetch throws a TypeError', async () => {
      const { fetchFn } = createFakeFetch([
        { throwError: new TypeError('fetch failed') },
      ]);

      const result = await safeFetchFeed(FEED_URL, {
        dnsLookup: publicDnsLookup,
        fetchFn,
      });

      expect(result).toEqual({ kind: 'error', reason: 'network' });
    });
  });

  describe('text encodings', () => {
    const TEXT = '<rss><title>Café</title></rss>';
    const LATIN_1_DECLARATION = '<?xml version="1.0" encoding="ISO-8859-1"?>';

    function toLatin1Bytes(text: string) {
      return Uint8Array.from(text, (character) => character.charCodeAt(0));
    }

    async function fetchFeedText(
      body: Uint8Array<ArrayBuffer>,
      contentType?: string,
    ) {
      const { fetchFn } = createFakeFetch([
        {
          body,
          headers:
            contentType === undefined
              ? undefined
              : { 'content-type': contentType },
          status: 200,
        },
      ]);

      return safeFetchFeed(FEED_URL, { dnsLookup: publicDnsLookup, fetchFn });
    }

    it.each<[string, Uint8Array<ArrayBuffer>, string | undefined, string]>([
      [
        'the charset of the Content-Type',
        toLatin1Bytes(TEXT),
        'application/rss+xml; charset=ISO-8859-1',
        TEXT,
      ],
      [
        'a quoted charset of the Content-Type',
        toLatin1Bytes(TEXT),
        'application/rss+xml; charset="ISO-8859-1"',
        TEXT,
      ],
      [
        'the encoding of the XML declaration when the Content-Type has no charset',
        toLatin1Bytes(`${LATIN_1_DECLARATION}${TEXT}`),
        'application/rss+xml',
        `${LATIN_1_DECLARATION}${TEXT}`,
      ],
      [
        'the charset of the Content-Type over the XML declaration',
        new TextEncoder().encode(`${LATIN_1_DECLARATION}${TEXT}`),
        'application/rss+xml; charset=utf-8',
        `${LATIN_1_DECLARATION}${TEXT}`,
      ],
      [
        'the byte order mark over the charset of the Content-Type',
        Uint8Array.from(Buffer.from(`\uFEFF${TEXT}`, 'utf16le')),
        'application/rss+xml; charset=utf-8',
        TEXT,
      ],
      [
        'UTF-8 when no charset and no XML declaration exist',
        new TextEncoder().encode(TEXT),
        undefined,
        TEXT,
      ],
      [
        'UTF-8 when an XML declaration of UTF-16 reads as ASCII',
        new TextEncoder().encode(
          `<?xml version="1.0" encoding="UTF-16"?>${TEXT}`,
        ),
        'application/rss+xml',
        `<?xml version="1.0" encoding="UTF-16"?>${TEXT}`,
      ],
    ])('should decode the body with %s', async (_, body, contentType, text) => {
      expect(await fetchFeedText(body, contentType)).toEqual({
        body: text,
        kind: 'ok',
      });
      expect(captureMessage).not.toHaveBeenCalled();
    });

    it('should decode the body as UTF-8, and log the label, when the charset is not known', async () => {
      const result = await fetchFeedText(
        new TextEncoder().encode(TEXT),
        'application/rss+xml; charset=x-not-an-encoding',
      );

      expect(result).toEqual({ body: TEXT, kind: 'ok' });
      expect(captureMessage).toHaveBeenCalledWith(
        'safe_fetch_unknown_charset',
        { extra: { charset: 'x-not-an-encoding' }, level: 'warning' },
      );
    });
  });

  describe('logs', () => {
    const SECRET_FEED_URL =
      'https://secret-host.example.com/private/token123.rss';

    it('should log the reason and the status of a failure', async () => {
      const { fetchFn } = createFakeFetch([{ status: 503 }]);

      await safeFetchFeed(FEED_URL, { dnsLookup: publicDnsLookup, fetchFn });

      expect(captureMessage).toHaveBeenCalledWith('safe_fetch_http_status', {
        extra: { reason: 'http_status', status: 503 },
        level: 'warning',
      });
    });

    it('should keep the feed URL out of every log call and result', async () => {
      const failingFetches = [
        safeFetchFeed(SECRET_FEED_URL, {
          dnsLookup: createDnsLookupFor('10.0.0.1', 4),
          fetchFn: createFetchThatMustNotRun(),
        }),
        safeFetchFeed(SECRET_FEED_URL, {
          dnsLookup: publicDnsLookup,
          fetchFn: createFakeFetch([{ status: 503 }]).fetchFn,
        }),
        safeFetchFeed(SECRET_FEED_URL, {
          dnsLookup: publicDnsLookup,
          fetchFn: createFakeFetch([
            {
              throwError: new TypeError(
                'fetch failed for secret-host.example.com',
              ),
            },
          ]).fetchFn,
        }),
        safeFetchFeed(SECRET_FEED_URL.replace('https://', 'https://user:pw@'), {
          dnsLookup: publicDnsLookup,
          fetchFn: createFetchThatMustNotRun(),
        }),
      ];

      const results = await Promise.all(failingFetches);
      const serialized = JSON.stringify([
        results,
        vi.mocked(captureMessage).mock.calls,
      ]);

      expect(vi.mocked(captureMessage).mock.calls).toHaveLength(4);
      expect(serialized).not.toContain('secret-host');
      expect(serialized).not.toContain('token123');
    });
  });

  describe('the default resolver', () => {
    function createCodedError(code: string) {
      return Object.assign(new Error(code), { code });
    }

    it('should give timeout for a resolver timeout (ETIMEOUT)', async () => {
      vi.spyOn(Resolver.prototype, 'resolve4').mockRejectedValue(
        createCodedError('ETIMEOUT'),
      );
      vi.spyOn(Resolver.prototype, 'resolve6').mockRejectedValue(
        createCodedError('ETIMEOUT'),
      );

      const result = await safeFetchFeed('http://slow.example.com/feed.xml', {
        fetchFn: createFetchThatMustNotRun(),
      });

      expect(result).toEqual({ kind: 'error', reason: 'timeout' });
    });

    it('should give blocked for a host with no record in either family', async () => {
      vi.spyOn(Resolver.prototype, 'resolve4').mockRejectedValue(
        createCodedError('ENOTFOUND'),
      );
      vi.spyOn(Resolver.prototype, 'resolve6').mockRejectedValue(
        createCodedError('ENODATA'),
      );

      const result = await safeFetchFeed('http://gone.example.com/feed.xml', {
        fetchFn: createFetchThatMustNotRun(),
      });

      expect(result).toEqual({ kind: 'error', reason: 'blocked' });
    });

    it('should fetch with an A record only', async () => {
      vi.spyOn(Resolver.prototype, 'resolve4').mockResolvedValue([PUBLIC_IPV4]);
      vi.spyOn(Resolver.prototype, 'resolve6').mockRejectedValue(
        createCodedError('ENODATA'),
      );

      const { fetchFn } = createFakeFetch([{ body: 'ok', status: 200 }]);
      const result = await safeFetchFeed(FEED_URL, { fetchFn });

      expect(result).toEqual({ body: 'ok', kind: 'ok' });
    });

    it('should fetch with an AAAA record only', async () => {
      vi.spyOn(Resolver.prototype, 'resolve4').mockRejectedValue(
        createCodedError('ENODATA'),
      );
      vi.spyOn(Resolver.prototype, 'resolve6').mockResolvedValue([
        '2606:4700:4700::1111',
      ]);

      const { fetchFn } = createFakeFetch([{ body: 'ok', status: 200 }]);
      const result = await safeFetchFeed(FEED_URL, { fetchFn });

      expect(result).toEqual({ body: 'ok', kind: 'ok' });
    });

    it('should give blocked when the resolver returns a private address', async () => {
      vi.spyOn(Resolver.prototype, 'resolve4').mockResolvedValue(['10.0.0.1']);
      vi.spyOn(Resolver.prototype, 'resolve6').mockRejectedValue(
        createCodedError('ENODATA'),
      );

      const result = await safeFetchFeed(FEED_URL, {
        fetchFn: createFetchThatMustNotRun(),
      });

      expect(result).toEqual({ kind: 'error', reason: 'blocked' });
    });

    it('should not surface a late rejection from an abandoned DNS lookup', async () => {
      vi.useFakeTimers();

      const unhandledRejectionListener = vi.fn();

      process.on('unhandledRejection', unhandledRejectionListener);

      try {
        let rejectLate: (error: Error) => void = () => {};

        const dnsLookup: DnsLookup = () =>
          new Promise<never>((_resolve, reject) => {
            rejectLate = reject;
          });
        const pending = safeFetchFeed(FEED_URL, {
          dnsLookup,
          fetchFn: createFetchThatMustNotRun(),
        });

        await vi.advanceTimersByTimeAsync(10_000);

        await expect(pending).resolves.toEqual({
          kind: 'error',
          reason: 'timeout',
        });

        rejectLate(new Error('late DNS failure'));
        await vi.advanceTimersByTimeAsync(0);

        expect(unhandledRejectionListener).not.toHaveBeenCalled();
      } finally {
        process.off('unhandledRejection', unhandledRejectionListener);
      }
    });
  });

  describe('safeFetchFeedResource', () => {
    it('should return the body text of a public 200 answer', async () => {
      const { fetchFn } = createFakeFetch([
        { body: '{"chapters":[]}', status: 200 },
      ]);

      const result = await safeFetchFeedResource(
        'https://example.com/chapters.json',
        { dnsLookup: publicDnsLookup, fetchFn },
      );

      expect(result).toEqual({ body: '{"chapters":[]}', kind: 'ok' });
    });

    it('should give too_large for a content-length of 6 MiB', async () => {
      const { fetchFn } = createFakeFetch([
        {
          body: 'x',
          headers: { 'content-length': String(6 * MEBIBYTE) },
          status: 200,
        },
      ]);

      const result = await safeFetchFeedResource(
        'https://example.com/chapters.json',
        { dnsLookup: publicDnsLookup, fetchFn },
      );

      expect(result).toEqual({
        kind: 'error',
        reason: 'too_large',
        status: 200,
      });
    });

    it('should give blocked for a loopback URL', async () => {
      const fetchFn = createFetchThatMustNotRun();

      const result = await safeFetchFeedResource(
        'http://127.0.0.1/chapters.json',
        { fetchFn },
      );

      expect(result).toEqual({ kind: 'error', reason: 'blocked' });
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });

  describe('safeFetchByteRange', () => {
    const IMAGE_URL = 'https://example.com/image.png';

    it('should ask for the first bytes, and report a 206 answer as an honored range', async () => {
      const { calls, fetchFn } = createFakeFetch([
        {
          body: new Uint8Array([1, 2, 3, 4, 5]),
          headers: { 'content-range': 'bytes 0-24/1000000' },
          status: 206,
        },
      ]);

      const result = await safeFetchByteRange(
        IMAGE_URL,
        { byteCount: 25, deadlineMilliseconds: 20_000 },
        {
          dnsLookup: publicDnsLookup,
          fetchFn,
        },
      );

      expect(calls[0].headers.get('range')).toBe('bytes=0-24');
      expect(result.kind).toBe('ok');

      if (result.kind === 'ok') {
        expect(Array.from(result.bytes)).toEqual([1, 2, 3, 4, 5]);
        expect(result.isRangeHonored).toBe(true);
      }
    });

    it('should cut a 200 answer that ignores the range at the cap', async () => {
      const fullBody = new Uint8Array(50).fill(0x42);
      const { fetchFn } = createFakeFetch([
        { body: createChunkedStream(fullBody, 10), status: 200 },
      ]);

      const result = await safeFetchByteRange(
        IMAGE_URL,
        { byteCount: 25, deadlineMilliseconds: 20_000 },
        {
          dnsLookup: publicDnsLookup,
          fetchFn,
        },
      );

      expect(result.kind).toBe('ok');

      if (result.kind === 'ok') {
        expect(result.bytes.byteLength).toBe(25);
        expect(result.isRangeHonored).toBe(false);
      }
    });

    it('should not fail a 200 answer whose content-length is over the cap', async () => {
      const { fetchFn } = createFakeFetch([
        {
          body: new Uint8Array(10),
          headers: { 'content-length': String(20 * MEBIBYTE) },
          status: 200,
        },
      ]);

      const result = await safeFetchByteRange(
        IMAGE_URL,
        { byteCount: 1000, deadlineMilliseconds: 20_000 },
        {
          dnsLookup: publicDnsLookup,
          fetchFn,
        },
      );

      expect(result.kind).toBe('ok');

      if (result.kind === 'ok') {
        expect(result.bytes.byteLength).toBe(10);
        expect(result.isRangeHonored).toBe(false);
      }
    });

    it('should give blocked for the cloud metadata address', async () => {
      const fetchFn = createFetchThatMustNotRun();

      const result = await safeFetchByteRange(
        'http://169.254.169.254/latest',
        { byteCount: MEBIBYTE, deadlineMilliseconds: 20_000 },
        { fetchFn },
      );

      expect(result).toEqual({ kind: 'error', reason: 'blocked' });
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });

  // Every other test gives a fake fetch, which does not pin the connection.
  // These tests run the default undici fetch and stop it at the socket, so
  // that a later undici version that drops `connect.lookup` fails here.
  describe('the default fetch', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it.each([
      {
        connectModule: net,
        feedUrl: 'http://feeds.example.com/feed.xml',
        name: 'net.connect',
      },
      {
        connectModule: tls,
        feedUrl: 'https://feeds.example.com/feed.xml',
        name: 'tls.connect',
      },
    ])(
      'should give $name only the checked address of the host',
      async ({ connectModule, feedUrl }) => {
        const connectOptions: Array<net.TcpNetConnectOpts> = [];
        const connectSpy = vi
          .spyOn(connectModule, 'connect')
          .mockImplementation(((options: net.TcpNetConnectOpts) => {
            connectOptions.push(options);

            const socket = new net.Socket();

            process.nextTick(() => {
              socket.destroy(new Error('The test opens no connection'));
            });

            return socket;
          }) as typeof connectModule.connect);

        const result = await safeFetchFeed(feedUrl, {
          dnsLookup: publicDnsLookup,
        });

        expect(result.kind).toBe('error');
        expect(connectSpy).toHaveBeenCalledOnce();

        const [options] = connectOptions;

        expect(options.host).toBe('feeds.example.com');
        expect(options.lookup).toBeTypeOf('function');

        const resolvedAddress = await new Promise((resolve, reject) => {
          options.lookup?.('feeds.example.com', {}, (error, address) => {
            if (error) {
              reject(error);

              return;
            }

            resolve(address);
          });
        });

        expect(resolvedAddress).toBe(PUBLIC_IPV4);
      },
    );
  });

  describe('pinLookup', () => {
    it('should return all checked addresses for an all lookup', () => {
      const lookup = pinLookup([
        { address: PUBLIC_IPV4, family: 4 },
        { address: '2606:4700::1', family: 6 },
      ]);
      let captured: unknown;

      lookup('ignored.example.com', { all: true }, (error, addresses) => {
        captured = { addresses, error };
      });

      expect(captured).toEqual({
        addresses: [
          { address: PUBLIC_IPV4, family: 4 },
          { address: '2606:4700::1', family: 6 },
        ],
        error: null,
      });
    });

    it('should return the first checked address for a single lookup', () => {
      const lookup = pinLookup([{ address: PUBLIC_IPV4, family: 4 }]);
      let captured: unknown;

      lookup('ignored.example.com', {}, (error, address, family) => {
        captured = { address, error, family };
      });

      expect(captured).toEqual({
        address: PUBLIC_IPV4,
        error: null,
        family: 4,
      });
    });

    it('should ignore the hostname that undici passes', () => {
      const lookup = pinLookup([{ address: '9.9.9.9', family: 4 }]);
      let pinnedAddress: unknown;

      lookup('rebound.example.com', {}, (_error, address) => {
        pinnedAddress = address;
      });

      expect(pinnedAddress).toBe('9.9.9.9');
    });

    it('should give an error when no checked address exists', () => {
      const lookup = pinLookup([]);
      let capturedError: unknown;

      lookup('example.com', {}, (error) => {
        capturedError = error;
      });

      expect(capturedError).toBeInstanceOf(Error);
    });
  });
});

import { captureMessage } from '@sentry/nextjs';

import type { DnsLookup } from 'utils/server/safeFetchFeed';

import { probeImage } from './probeImage';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const MEBIBYTE = 1024 * 1024;
const IMAGE_URL = 'https://example.com/cover.png';

const publicDnsLookup: DnsLookup = async () => [
  { address: '93.184.215.14', family: 4 },
];

/**
 * Returns the signature and the IHDR chunk of a PNG, followed by zero bytes up
 * to `totalByteCount`. The CRC of the chunk is zero, and the probe does not
 * read it.
 */
function createPngBytes(
  width: number,
  height: number,
  totalByteCount = 64,
): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(totalByteCount);
  const view = new DataView(bytes.buffer);

  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  view.setUint32(8, 13);
  bytes.set(new TextEncoder().encode('IHDR'), 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([8, 6, 0, 0, 0], 24);

  return bytes;
}

function createFakeFetch(response: () => Response) {
  const requestHeaders: Array<Headers> = [];
  const fetchFn = vi.fn(
    async (_input: string, init?: RequestInit): Promise<Response> => {
      requestHeaders.push(new Headers(init?.headers));

      return response();
    },
  );

  return { fetchFn, requestHeaders };
}

describe('probeImage', () => {
  afterEach(() => {
    vi.mocked(captureMessage).mockClear();
    vi.restoreAllMocks();
  });

  it('should give the image host a deadline of 3 seconds, not the 20 seconds of a feed read', async () => {
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    const { fetchFn } = createFakeFetch(
      () => new Response(createPngBytes(1, 1)),
    );

    await probeImage(IMAGE_URL, { dnsLookup: publicDnsLookup, fetchFn });

    expect(timeoutSpy).toHaveBeenCalledWith(3000);
    expect(timeoutSpy).not.toHaveBeenCalledWith(20_000);
  });

  it('should return no size and open no connection for http://169.254.169.254/latest', async () => {
    const dnsLookup = vi.fn(publicDnsLookup);
    const { fetchFn } = createFakeFetch(
      () => new Response(createPngBytes(1, 1)),
    );

    const size = await probeImage('http://169.254.169.254/latest', {
      dnsLookup,
      fetchFn,
    });

    expect(size).toBeNull();
    expect(dnsLookup).not.toHaveBeenCalled();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('should return the width and height of a public PNG, and ask for the first 1 MiB only', async () => {
    const { fetchFn, requestHeaders } = createFakeFetch(
      () =>
        new Response(createPngBytes(1400, 900), {
          headers: { 'content-type': 'image/png' },
          status: 206,
        }),
    );

    const size = await probeImage(IMAGE_URL, {
      dnsLookup: publicDnsLookup,
      fetchFn,
    });

    expect(size).toEqual({ height: 900, width: 1400 });
    expect(requestHeaders[0].get('range')).toBe('bytes=0-1048575');
  });

  it('should return the width and height of a PNG of 3 MiB with a content-length header', async () => {
    const pngBytes = createPngBytes(3000, 2000, 3 * MEBIBYTE);
    const { fetchFn } = createFakeFetch(
      () =>
        new Response(pngBytes, {
          headers: { 'content-length': String(pngBytes.byteLength) },
          status: 200,
        }),
    );

    const size = await probeImage(IMAGE_URL, {
      dnsLookup: publicDnsLookup,
      fetchFn,
    });

    expect(size).toEqual({ height: 2000, width: 3000 });
  });

  it('should return no size and log an event with no URL for bytes that are not an image', async () => {
    const { fetchFn } = createFakeFetch(
      () => new Response('<html>member-secret</html>', { status: 200 }),
    );

    const size = await probeImage(IMAGE_URL, {
      dnsLookup: publicDnsLookup,
      fetchFn,
    });

    expect(size).toBeNull();
    expect(captureMessage).toHaveBeenCalledWith('probe_image_failed', {
      extra: { reason: 'unknown_format' },
      level: 'warning',
    });
  });

  it('should return no size and log no event of its own when the guard fails', async () => {
    const { fetchFn } = createFakeFetch(
      () => new Response(null, { status: 404 }),
    );

    const size = await probeImage(IMAGE_URL, {
      dnsLookup: publicDnsLookup,
      fetchFn,
    });

    expect(size).toBeNull();
    expect(captureMessage).toHaveBeenCalledOnce();
    expect(captureMessage).toHaveBeenCalledWith(
      'safe_fetch_http_status',
      expect.anything(),
    );
  });
});

import { inspect } from 'node:util';

import { NetworkError, request } from './request';

const FEED_URL = 'https://example.com/private/token123.rss';
const REQUEST_URL = `https://api.podcastindex.org/api/1.0/podcasts/byfeedurl?url=${encodeURIComponent(FEED_URL)}`;

function stubFetchThatNeverAnswers() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(
    (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(init.signal?.reason);
        });
      }),
  );
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

async function catchError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new Error('Expected the promise to reject');
}

describe('request', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return the parsed JSON body of a successful response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ status: 'true' }),
    );

    await expect(request(REQUEST_URL)).resolves.toEqual({ status: 'true' });
  });

  it('should pass the request options and an abort signal to fetch', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({}));

    await request(REQUEST_URL, { headers: { 'X-Test': 'yes' }, method: 'get' });

    const [input, init] = fetchSpy.mock.calls[0];

    expect(input).toBe(REQUEST_URL);
    expect(init?.method).toBe('get');
    expect(init?.headers).toEqual({ 'X-Test': 'yes' });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('should throw a NetworkError with the endpoint path and the status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('secret body text', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    const error = await catchError(request(REQUEST_URL));

    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toMatchObject({
      endpointPath: '/api/1.0/podcasts/byfeedurl',
      name: 'NetworkError',
      status: 500,
    });
    expect((error as NetworkError).message).toContain(
      '/api/1.0/podcasts/byfeedurl',
    );
    expect((error as NetworkError).message).toContain('500');
  });

  it('should keep the feed URL, the body text, and the response out of the error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('secret body text', { status: 500 }),
    );

    const error = await catchError(request(REQUEST_URL));
    const inspected = inspect(error, { depth: Infinity, showHidden: true });

    expect(inspected).not.toContain('example.com');
    expect(inspected).not.toContain('token123');
    expect(inspected).not.toContain(encodeURIComponent(FEED_URL));
    expect(inspected).not.toContain('secret body text');
    expect(error).not.toHaveProperty('response');
    expect(error).not.toHaveProperty('cause');
  });

  it('should reject with a timeout when the call does not answer in 5 seconds', async () => {
    stubTimeoutSignalOnFakeTimers();
    stubFetchThatNeverAnswers();

    let isSettled = false;
    const result = request(REQUEST_URL).finally(() => {
      isSettled = true;
    });
    const assertion = expect(result).rejects.toMatchObject({
      name: 'TimeoutError',
    });

    await vi.advanceTimersByTimeAsync(4_999);

    expect(isSettled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await assertion;
  });

  it('should abort a slow body read at the same deadline', async () => {
    stubTimeoutSignalOnFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const body = new ReadableStream({
        start(controller) {
          init?.signal?.addEventListener('abort', () => {
            controller.error(init.signal?.reason);
          });
        },
      });

      return new Response(body, { status: 200 });
    });

    const assertion = expect(request(REQUEST_URL)).rejects.toMatchObject({
      name: 'TimeoutError',
    });

    await vi.advanceTimersByTimeAsync(5_000);
    await assertion;
  });
});

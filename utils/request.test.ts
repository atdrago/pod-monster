import { request } from './request';

const GENERAL_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

function stubFetchResponse(body: unknown, init: ResponseInit) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), init)),
  );
}

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return the body of a successful response', async () => {
    stubFetchResponse([{ startTime: 0 }], { status: 200 });

    await expect(request('/api/podcasts/chapters')).resolves.toEqual([
      { startTime: 0 },
    ]);
  });

  it.each([
    ['blocked', "We can't load files from this address."],
    [
      'http_status',
      "The podcast's server sent an error. Please try again later.",
    ],
    ['invalid_body', "We couldn't read this file."],
    [
      'network',
      "We couldn't reach the podcast's server. Please try again later.",
    ],
    [
      'timeout',
      "The podcast's server took too long to respond. Please try again later.",
    ],
    ['too_large', 'This file is too large for us to load.'],
    ['unsupported_type', "We can't show this transcript format."],
  ])(
    'should throw a readable message for the proxy error code `%s`',
    async (code, message) => {
      stubFetchResponse({ error: { code } }, { status: 502 });

      await expect(request('/api/podcasts/chapters')).rejects.toThrow(
        new Error(message),
      );
    },
  );

  it('should throw a general message for an unknown proxy error code', async () => {
    stubFetchResponse({ error: { code: 'missing_url' } }, { status: 400 });

    await expect(request('/api/podcasts/chapters')).rejects.toThrow(
      new Error(GENERAL_ERROR_MESSAGE),
    );
  });

  it('should throw the message of an error response with a message', async () => {
    stubFetchResponse(
      { error: { message: 'Invalid OPML file.', name: null, stack: null } },
      { status: 400 },
    );

    await expect(request('/api/settings/opml/import')).rejects.toThrow(
      new Error('Invalid OPML file.'),
    );
  });

  it('should throw a general message for an error status with no status text and no error body', async () => {
    stubFetchResponse({}, { status: 500, statusText: '' });

    await expect(request('/api/podcasts/chapters')).rejects.toThrow(
      new Error(GENERAL_ERROR_MESSAGE),
    );
  });
});

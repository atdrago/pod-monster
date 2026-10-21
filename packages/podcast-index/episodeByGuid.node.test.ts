import { inspect } from 'node:util';

import { episodeByGuid } from './episodeByGuid';
import { NetworkError } from './utils/request';

const CONFIG = {
  apiKey: 'test-api-key',
  authTime: 1_700_000_000,
  authToken: 'test-auth-token',
  userAgent: 'pod.monster/test',
};
const FEED_URL = 'https://example.com/private/token123.rss';
const GUID = 'episode guid & more';

describe('episodeByGuid', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call episodes/byguid with the guid, the feed URL, and full text', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ episode: {}, status: 'true' }));

    await episodeByGuid(GUID, FEED_URL, CONFIG);

    const [input, init] = fetchSpy.mock.calls[0];
    const requestUrl = new URL(String(input));

    expect(requestUrl.origin).toBe('https://api.podcastindex.org');
    expect(requestUrl.pathname).toBe('/api/1.0/episodes/byguid');
    expect(requestUrl.searchParams.get('guid')).toBe(GUID);
    expect(requestUrl.searchParams.get('feedurl')).toBe(FEED_URL);
    expect(requestUrl.searchParams.get('fulltext')).toBe('true');
    expect(init?.method).toBe('get');
    expect(init?.headers).toMatchObject({
      Authorization: 'test-auth-token',
      'User-Agent': 'pod.monster/test',
      'X-Auth-Date': '1700000000',
      'X-Auth-Key': 'test-api-key',
    });
  });

  it('should encode a guid that holds an ampersand and a space', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ episode: {}, status: 'true' }));

    await episodeByGuid(GUID, FEED_URL, CONFIG);

    const [input] = fetchSpy.mock.calls[0];

    expect(String(input)).toContain('guid=episode+guid+%26+more');
    expect(String(input)).not.toContain('&+more');
  });

  it('should return the response body', async () => {
    const body = { episode: { guid: GUID, id: 1 }, status: 'true' };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(body));

    await expect(episodeByGuid(GUID, FEED_URL, CONFIG)).resolves.toEqual(body);
  });

  it('should throw a NetworkError that names episodes/byguid and the status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(`no episode for ${FEED_URL}`, { status: 500 }),
    );

    const promise = episodeByGuid(GUID, FEED_URL, CONFIG);

    await expect(promise).rejects.toBeInstanceOf(NetworkError);
    await expect(promise).rejects.toThrow('episodes/byguid');
    await expect(promise).rejects.toThrow('500');
  });

  it('should keep the feed URL, the guid, and the body text out of the error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(`no episode for ${FEED_URL}`, { status: 500 }),
    );

    let caughtError: unknown;

    try {
      await episodeByGuid(GUID, FEED_URL, CONFIG);
    } catch (error) {
      caughtError = error;
    }

    const inspected = inspect(caughtError, {
      depth: Infinity,
      showHidden: true,
    });

    expect(caughtError).toBeInstanceOf(NetworkError);
    expect(inspected).not.toContain('example.com');
    expect(inspected).not.toContain('token123');
    expect(inspected).not.toContain('no episode for');
    expect(inspected).not.toContain('episode+guid');
    expect(inspected).not.toContain(GUID);
    expect(caughtError).not.toHaveProperty('response');
  });
});

import { redactFeedPaths, redactSentryData } from './redactFeedPaths';

const SITE_ORIGIN = 'https://pod.monster';

describe('redactFeedPaths', () => {
  describe('redactFeedPaths', () => {
    it('should replace the segments of a bare path with the route names', () => {
      expect(redactFeedPaths('/feeds/abc/episodes/def?t=10')).toBe(
        '/feeds/[feedUrlBase64]/episodes/[guidBase64]?t=10',
      );
    });

    it('should replace the segments of a path inside a full URL', () => {
      expect(
        redactFeedPaths('https://pod.monster/feeds/abc/episodes/def?t=10'),
      ).toBe(
        'https://pod.monster/feeds/[feedUrlBase64]/episodes/[guidBase64]?t=10',
      );
    });

    it('should replace a show segment before a fragment', () => {
      expect(redactFeedPaths('/feeds/abc#episodes')).toBe(
        '/feeds/[feedUrlBase64]#episodes',
      );
    });

    it('should remove the whole segment of a standard base64 form', () => {
      expect(redactFeedPaths('/feeds/ab+c=')).toBe('/feeds/[feedUrlBase64]');
      expect(redactFeedPaths('/feeds/ab%2Bc%3D/episodes/d%2Fe')).toBe(
        '/feeds/[feedUrlBase64]/episodes/[guidBase64]',
      );
    });

    it('should end a segment at a quote', () => {
      expect(redactFeedPaths('<a href="/feeds/abc">Show</a>')).toBe(
        '<a href="/feeds/[feedUrlBase64]">Show</a>',
      );
      expect(redactFeedPaths("Failed to load '/feeds/abc'")).toBe(
        "Failed to load '/feeds/[feedUrlBase64]'",
      );
    });

    it('should end a segment at whitespace', () => {
      expect(redactFeedPaths('GET /feeds/abc 404')).toBe(
        'GET /feeds/[feedUrlBase64] 404',
      );
    });

    it('should replace the segment of a path in capitals', () => {
      expect(redactFeedPaths('/FEEDS/abc')).toBe('/FEEDS/[feedUrlBase64]');
    });

    it('should replace the value of a url query parameter', () => {
      expect(
        redactFeedPaths(
          '/api/podcasts/chapters?url=https%3A%2F%2Fexample.com%2Ffeed&type=json',
        ),
      ).toBe('/api/podcasts/chapters?url=[redacted]&type=json');
    });

    it('should replace the value of a feedurl query parameter', () => {
      expect(
        redactFeedPaths(
          'episodes/byguid?guid=abc&feedurl=https%3A%2F%2Fexample.com%2Ffeed',
        ),
      ).toBe('episodes/byguid?guid=abc&feedurl=[redacted]');
      expect(redactFeedPaths('?feedUrl=https://example.com/feed')).toBe(
        '?feedUrl=[redacted]',
      );
    });

    it('should not change a query parameter whose name only ends in url', () => {
      expect(redactFeedPaths('?imageurl=abc')).toBe('?imageurl=abc');
    });

    it('should not change a string with no feed path', () => {
      expect(redactFeedPaths('/api/podcasts/episodes?feedId=123')).toBe(
        '/api/podcasts/episodes?feedId=123',
      );
      expect(redactFeedPaths('/feeds/')).toBe('/feeds/');
    });
  });

  describe('redactSentryData', () => {
    it('should cut a URL that is not on the site origin to its origin', () => {
      expect(
        redactSentryData(
          'https://cdn.example.com/ep.mp3?token=abc',
          SITE_ORIGIN,
        ),
      ).toBe('https://cdn.example.com');
    });

    it('should remove the user name and the password of a URL', () => {
      expect(
        redactSentryData(
          'https://listener:hunter2@cdn.example.com/ep.mp3',
          SITE_ORIGIN,
        ),
      ).toBe('https://cdn.example.com');
    });

    it('should cut each URL inside a longer string', () => {
      expect(
        redactSentryData(
          'Failed to fetch https://cdn.example.com/ep.mp3?token=abc (404) from "http://other.example.com/a/b"',
          SITE_ORIGIN,
        ),
      ).toBe(
        'Failed to fetch https://cdn.example.com (404) from "http://other.example.com"',
      );
    });

    it('should keep a URL on the site origin after the path redaction', () => {
      expect(
        redactSentryData(
          'https://pod.monster/feeds/abc/episodes/def?t=10',
          SITE_ORIGIN,
        ),
      ).toBe(
        'https://pod.monster/feeds/[feedUrlBase64]/episodes/[guidBase64]?t=10',
      );
    });

    it('should cut a URL that is not on the site origin inside the query of a site URL', () => {
      expect(
        redactSentryData(
          'https://pod.monster/search?next=https://cdn.example.com/ep.mp3?token=abc',
          SITE_ORIGIN,
        ),
      ).toBe('https://pod.monster/search?next=https://cdn.example.com');
    });

    it('should replace the url query value of a site URL', () => {
      expect(
        redactSentryData(
          'https://pod.monster/api/podcasts/chapters?url=https%3A%2F%2Fcdn.example.com%2Fc.json',
          SITE_ORIGIN,
        ),
      ).toBe('https://pod.monster/api/podcasts/chapters?url=[redacted]');
    });

    it('should change strings in nested arrays and objects', () => {
      const event = {
        breadcrumbs: [
          {
            data: { url: '/feeds/abc/episodes/def' },
            message: 'https://cdn.example.com/image.jpg?token=abc',
          },
        ],
        request: { url: 'https://pod.monster/feeds/abc' },
        tags: ['/feeds/abc', ['/episodes/def']],
      };

      expect(redactSentryData(event, SITE_ORIGIN)).toEqual({
        breadcrumbs: [
          {
            data: { url: '/feeds/[feedUrlBase64]/episodes/[guidBase64]' },
            message: 'https://cdn.example.com',
          },
        ],
        request: { url: 'https://pod.monster/feeds/[feedUrlBase64]' },
        tags: ['/feeds/[feedUrlBase64]', ['/episodes/[guidBase64]']],
      });
    });

    it('should change the keys of an object', () => {
      expect(
        redactSentryData(
          { 'https://cdn.example.com/ep.mp3?token=abc': 'loaded' },
          SITE_ORIGIN,
        ),
      ).toEqual({ 'https://cdn.example.com': 'loaded' });
    });

    it('should leave numbers, booleans, null, and undefined as they are', () => {
      expect(
        redactSentryData(
          {
            count: 3,
            isHandled: false,
            nothing: null,
            ratio: 0.5,
            unset: undefined,
          },
          SITE_ORIGIN,
        ),
      ).toEqual({
        count: 3,
        isHandled: false,
        nothing: null,
        ratio: 0.5,
        unset: undefined,
      });
      expect(redactSentryData(42, SITE_ORIGIN)).toBe(42);
      expect(redactSentryData(true, SITE_ORIGIN)).toBe(true);
    });

    it('should not change the input', () => {
      const breadcrumb = { data: { url: '/feeds/abc' } };

      redactSentryData(breadcrumb, SITE_ORIGIN);

      expect(breadcrumb).toEqual({ data: { url: '/feeds/abc' } });
    });

    it('should copy an object that refers to itself', () => {
      const data: { label: string; self?: unknown } = { label: '/feeds/abc' };
      data.self = data;

      const redacted = redactSentryData(data, SITE_ORIGIN);

      expect(redacted.label).toBe('/feeds/[feedUrlBase64]');
      expect(redacted.self).toBe(redacted);
    });

    it('should return an object that is not a plain object as it is', () => {
      const date = new Date(0);

      expect(redactSentryData({ date }, SITE_ORIGIN).date).toBe(date);
    });
  });
});

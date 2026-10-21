import { normalizeFeedUrl } from './normalizeFeedUrl';

describe('normalizeFeedUrl', () => {
  it.each([
    [
      'HTTPS://Feeds.Example.COM/feed.xml',
      'https://feeds.example.com/feed.xml',
    ],
    ['https://example.com:443/feed.xml', 'https://example.com/feed.xml'],
    ['http://example.com:80/feed.xml', 'http://example.com/feed.xml'],
    ['https://example.com/feed.xml#latest', 'https://example.com/feed.xml'],
    ['https://example.com', 'https://example.com/'],
    ['https://example.com/my feed.xml', 'https://example.com/my%20feed.xml'],
  ])('should normalize %s to %s', (feedUrl, normalizedFeedUrl) => {
    expect(normalizeFeedUrl(feedUrl)).toBe(normalizedFeedUrl);
  });

  it('should keep the case of the path and the query, because a feed token is case sensitive', () => {
    const feedUrl = 'https://example.com/RSS/Show?auth=AbC123';

    expect(normalizeFeedUrl(feedUrl)).toBe(feedUrl);
  });

  it('should give the same value for a normalized feed URL', () => {
    const normalizedFeedUrl = normalizeFeedUrl(
      'HTTPS://Example.com:443/my feed.xml#top',
    );

    expect(normalizedFeedUrl).not.toBeNull();
    expect(normalizeFeedUrl(normalizedFeedUrl!)).toBe(normalizedFeedUrl);
  });

  it.each(['', 'example.com/feed.xml', 'not a url'])(
    'should give null for "%s", which does not parse as a URL',
    (value) => {
      expect(normalizeFeedUrl(value)).toBeNull();
    },
  );
});

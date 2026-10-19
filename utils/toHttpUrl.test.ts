import { toHttpUrl } from './toHttpUrl';

describe('toHttpUrl', () => {
  it.each([
    'http://example.com/feed.xml',
    'https://example.com/feed.xml?auth=Secret',
    'HTTPS://EXAMPLE.COM/Feed.xml',
  ])('should give %s back with no change', (value) => {
    expect(toHttpUrl(value)).toBe(value);
  });

  it.each([
    'ftp://example.com/feed.xml',
    'javascript:alert(1)',
    'data:text/plain,hello',
    'mailto:host@example.com',
  ])('should give undefined for the URL %s of another protocol', (value) => {
    expect(toHttpUrl(value)).toBeUndefined();
  });

  it.each(['', 'example.com/feed.xml', '/feeds/abc', 'not a url'])(
    'should give undefined for "%s", which does not parse as a URL',
    (value) => {
      expect(toHttpUrl(value)).toBeUndefined();
    },
  );

  it.each([undefined, null, 42, { href: 'https://example.com/' }])(
    'should give undefined for the value %s, which is not a string',
    (value) => {
      expect(toHttpUrl(value)).toBeUndefined();
    },
  );
});

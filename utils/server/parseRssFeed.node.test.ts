import { captureMessage } from '@sentry/nextjs';

import { parseRssFeed } from './parseRssFeed';

vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn() }));

const FEED_URL = 'https://example.com/private/token123.rss';

function createRssFeed(channelBody: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:podcast="https://podcastindex.org/namespace/1.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Show Title</title>
    <link>https://example.com/show</link>
    <description>Show description</description>
    ${channelBody}
  </channel>
</rss>`;
}

function createItem({
  enclosureUrl = 'https://example.com/episode.mp3',
  guid,
  title = 'Episode',
}: {
  enclosureUrl?: string;
  guid?: string;
  title?: string;
}) {
  return `<item>
    <title>${title}</title>
    ${guid === undefined ? '' : `<guid isPermaLink="false">${guid}</guid>`}
    <enclosure url="${enclosureUrl}" length="1" type="audio/mpeg"/>
  </item>`;
}

describe('parseRssFeed', () => {
  afterEach(() => {
    vi.mocked(captureMessage).mockClear();
  });

  it('should map an RSS 2.0 feed with itunes and podcast tags to the show and its episodes', () => {
    const body = createRssFeed(`
      <itunes:author>Show Author</itunes:author>
      <itunes:image href="https://example.com/show.jpg"/>
      <itunes:explicit>true</itunes:explicit>
      <itunes:type>serial</itunes:type>
      <itunes:category text="Arts"><itunes:category text="Books"/></itunes:category>
      <itunes:category text="Comedy"/>
      <podcast:funding url="https://example.com/donate">Support the show</podcast:funding>
      <item>
        <title>Episode One</title>
        <guid isPermaLink="false">episode-1</guid>
        <enclosure url="https://example.com/1.mp3" length="123" type="audio/mpeg"/>
        <itunes:duration>01:02:03</itunes:duration>
        <itunes:image href="https://example.com/1.jpg"/>
        <itunes:explicit>false</itunes:explicit>
        <itunes:episodeType>Full</itunes:episodeType>
        <itunes:season>2</itunes:season>
        <itunes:episode>3</itunes:episode>
        <pubDate>Wed, 04 Oct 2023 11:59:00 +0000</pubDate>
        <description>Short description</description>
        <content:encoded><![CDATA[<p>Full description</p>]]></content:encoded>
        <podcast:chapters url="https://example.com/1/chapters.json" type="application/json+chapters"/>
        <podcast:transcript url="https://example.com/1/transcript.vtt" type="text/vtt" language="en"/>
        <podcast:transcript url="https://example.com/1/transcript.srt" type="application/srt"/>
        <podcast:person role="guest" href="https://example.com/jane" img="https://example.com/jane.jpg">Jane Doe</podcast:person>
      </item>
    `);

    const result = parseRssFeed(body, FEED_URL);

    expect(result.kind).toBe('feed');

    if (result.kind !== 'feed') {
      return;
    }

    expect(result.feed).toEqual({
      author: 'Show Author',
      categories: ['Arts', 'Books', 'Comedy'],
      description: 'Show description',
      explicit: true,
      format: 'rss',
      funding: {
        message: 'Support the show',
        url: 'https://example.com/donate',
      },
      image: 'https://example.com/show.jpg',
      isSerial: true,
      link: 'https://example.com/show',
      title: 'Show Title',
      url: FEED_URL,
    });
    expect(result.episodes).toEqual([
      {
        chaptersUrl: 'https://example.com/1/chapters.json',
        datePublished: 1696420740,
        description: '<p>Full description</p>',
        duration: 3723,
        enclosureType: 'audio/mpeg',
        enclosureUrl: 'https://example.com/1.mp3',
        episodeNumber: 3,
        episodeType: 'full',
        explicit: false,
        feedImage: 'https://example.com/show.jpg',
        feedTitle: 'Show Title',
        feedUrl: FEED_URL,
        identity: 'episode-1',
        image: 'https://example.com/1.jpg',
        persons: [
          {
            href: 'https://example.com/jane',
            img: 'https://example.com/jane.jpg',
            name: 'Jane Doe',
            role: 'guest',
          },
        ],
        seasonNumber: 2,
        title: 'Episode One',
        transcripts: [
          {
            language: 'en',
            type: 'text/vtt',
            url: 'https://example.com/1/transcript.vtt',
          },
          {
            type: 'application/srt',
            url: 'https://example.com/1/transcript.srt',
          },
        ],
      },
    ]);
  });

  it('should prefer the podcast season and episode numbers over the itunes numbers', () => {
    const body = createRssFeed(`
      <item>
        <guid>episode-1</guid>
        <enclosure url="https://example.com/1.mp3" length="1" type="audio/mpeg"/>
        <itunes:season>2</itunes:season>
        <itunes:episode>3</itunes:episode>
        <podcast:season>4</podcast:season>
        <podcast:episode>5.5</podcast:episode>
      </item>
    `);

    const result = parseRssFeed(body, FEED_URL);

    expect(result.kind === 'feed' && result.episodes[0]).toMatchObject({
      episodeNumber: 5.5,
      seasonNumber: 4,
    });
  });

  it('should give an item with no guid its enclosure URL as the identity', () => {
    const body = createRssFeed(
      createItem({ enclosureUrl: 'https://example.com/no-guid.mp3' }),
    );

    const result = parseRssFeed(body, FEED_URL);

    expect(result.kind === 'feed' && result.episodes[0].identity).toBe(
      'https://example.com/no-guid.mp3',
    );
  });

  it('should give an item with a blank guid its enclosure URL as the identity', () => {
    const body = createRssFeed(
      createItem({
        enclosureUrl: 'https://example.com/blank-guid.mp3',
        guid: '   ',
      }),
    );

    const result = parseRssFeed(body, FEED_URL);

    expect(result.kind === 'feed' && result.episodes[0].identity).toBe(
      'https://example.com/blank-guid.mp3',
    );
  });

  it('should trim the spaces at the ends of a guid, with no change of case', () => {
    const body = createRssFeed(createItem({ guid: '  Episode-ABC 1  ' }));

    const result = parseRssFeed(body, FEED_URL);

    expect(result.kind === 'feed' && result.episodes[0].identity).toBe(
      'Episode-ABC 1',
    );
  });

  it('should keep only the first item for two items with the same guid', () => {
    const body = createRssFeed(
      [
        createItem({ guid: 'same', title: 'First' }),
        createItem({ guid: 'other', title: 'Other' }),
        createItem({ guid: 'same', title: 'Second' }),
      ].join(''),
    );

    const result = parseRssFeed(body, FEED_URL);

    expect(
      result.kind === 'feed' &&
        result.episodes.map(({ identity, title }) => [identity, title]),
    ).toEqual([
      ['same', 'First'],
      ['other', 'Other'],
    ]);
  });

  it('should map a feed with 150 items to 150 episodes in feed order', () => {
    const items = Array.from({ length: 150 }, (_, index) =>
      createItem({ guid: `guid-${index}`, title: `Episode ${index}` }),
    );
    const body = createRssFeed(items.join(''));

    const result = parseRssFeed(body, FEED_URL);

    expect(result.kind).toBe('feed');

    if (result.kind === 'feed') {
      expect(result.episodes).toHaveLength(150);
      expect(result.episodes.map(({ identity }) => identity)).toEqual(
        Array.from({ length: 150 }, (_, index) => `guid-${index}`),
      );
    }
  });

  it('should drop a link or an image URL that is not http or https', () => {
    const body = `<?xml version="1.0"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Show</title>
    <link>javascript:alert(1)</link>
    <description>Description</description>
    <itunes:image href="data:image/png;base64,AAAA"/>
    ${createItem({ guid: 'episode-1' })}
  </channel>
</rss>`;

    const result = parseRssFeed(body, FEED_URL);

    expect(result.kind).toBe('feed');

    if (result.kind === 'feed') {
      expect(result.feed.link).toBeUndefined();
      expect(result.feed.image).toBeUndefined();
      expect(result.episodes[0].feedImage).toBeUndefined();
    }
  });

  it.each([
    [
      'a body with <!DOCTYPE',
      `<!DOCTYPE rss [<!ENTITY a "a">]>${createRssFeed(createItem({ guid: 'one' }))}`,
    ],
    [
      'a body with <!doctype',
      `<!doctype rss>${createRssFeed(createItem({ guid: 'one' }))}`,
    ],
    [
      'an HTML page',
      '<html><head><title>Hi</title></head><body></body></html>',
    ],
    [
      'an Atom feed',
      '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><id>urn:a</id><updated>2023-01-01T00:00:00Z</updated></feed>',
    ],
    ['an RSS document with no channel', '<rss version="2.0"></rss>'],
    ['an empty body', ''],
  ])('should give not a feed for %s', (_, body) => {
    expect(parseRssFeed(body, FEED_URL)).toEqual({ kind: 'not_a_feed' });
  });

  it('should log the reason for not a feed, with no feed URL', () => {
    parseRssFeed('<!DOCTYPE html><html></html>', FEED_URL);

    expect(captureMessage).toHaveBeenCalledWith('rss_feed_not_parsed', {
      extra: { reason: 'doctype' },
      level: 'warning',
    });
    expect(JSON.stringify(vi.mocked(captureMessage).mock.calls)).not.toContain(
      'token123',
    );
  });
});

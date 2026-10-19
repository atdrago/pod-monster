import type { Episode } from '@atdrago/podcast-index';
import type {
  PIApiEpisodeDetail,
  PIApiPodcast,
} from 'podcastdx-client/src/types';

import {
  mapPodcastIndexEpisode,
  mapPodcastIndexFeed,
} from './mapPodcastIndexFeed';

const FEED_URL = 'https://example.com/feed.xml';

function createPodcastIndexFeed(
  overrides: Partial<PIApiPodcast> & { itunesType?: string } = {},
): PIApiPodcast {
  return {
    artwork: 'https://example.com/artwork.jpg',
    author: 'Show Author',
    categories: { '55': 'News', '9': 'Business' },
    chash: 'hash',
    contentType: 'application/rss+xml',
    crawlErrors: 0,
    dead: 0,
    description: 'Show description',
    episodeCount: 2,
    explicit: true,
    funding: { message: 'Support the show', url: 'https://example.com/donate' },
    generator: null,
    id: 920666,
    image: 'https://example.com/show.jpg',
    itunesId: 1441923632,
    language: 'en',
    lastCrawlTime: 1_700_000_000,
    lastGoodHttpStatusTime: 1_700_000_000,
    lastHttpStatus: 200,
    lastParseTime: 1_700_000_000,
    lastUpdateTime: 1_700_000_000,
    link: 'https://example.com/show',
    originalUrl: 'https://example.com/old-feed.xml',
    ownerName: 'Show Owner',
    parseErrors: 0,
    title: ' Show Title ',
    type: 0,
    url: 'https://example.com/podcast-index-feed.xml',
    ...overrides,
  };
}

function createPodcastIndexEpisode(
  overrides: Partial<PIApiEpisodeDetail> = {},
): PIApiEpisodeDetail {
  return {
    chaptersUrl: 'https://example.com/1/chapters.json',
    dateCrawled: 1_700_000_100,
    datePublished: 1_696_420_740,
    datePublishedPretty: 'October 04, 2023 11:59am',
    description: '<p>Full description</p>',
    duration: 3723,
    enclosureLength: 123,
    enclosureType: 'audio/mpeg',
    enclosureUrl: 'https://example.com/1.mp3',
    episode: 3,
    episodeType: 'full',
    explicit: 1,
    feedId: 920666,
    feedImage: 'https://example.com/show.jpg',
    feedItunesId: 1441923632,
    feedLanguage: 'en',
    feedTitle: 'Show Title',
    guid: 'episode-1',
    id: 16_795_090,
    image: 'https://example.com/1.jpg',
    link: 'https://example.com/1',
    persons: [
      {
        group: 'cast',
        href: 'https://example.com/jane',
        id: 1,
        img: 'https://example.com/jane.jpg',
        name: 'Jane Doe',
        role: 'guest',
      },
    ],
    season: 2,
    title: ' Episode One ',
    transcriptUrl: 'https://example.com/1/transcript.vtt',
    transcripts: [
      { type: 'text/vtt', url: 'https://example.com/1/transcript.vtt' },
    ],
    ...overrides,
  };
}

const MAPPED_FEED = mapPodcastIndexFeed(createPodcastIndexFeed(), FEED_URL);

describe('mapPodcastIndexFeed', () => {
  describe('shows', () => {
    it('should map the show fields that the pages render', () => {
      expect(
        mapPodcastIndexFeed(
          createPodcastIndexFeed({ itunesType: 'serial' }),
          FEED_URL,
        ),
      ).toEqual({
        author: 'Show Author',
        categories: ['Business', 'News'],
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
        podcastIndexId: 920666,
        title: 'Show Title',
        url: FEED_URL,
      });
    });

    it('should keep the requested feed URL, not the URL that Podcast Index stores', () => {
      expect(MAPPED_FEED.url).toBe(FEED_URL);
    });

    it('should map type 1 to the atom format and type 0 to the rss format', () => {
      expect(
        mapPodcastIndexFeed(createPodcastIndexFeed({ type: 1 }), FEED_URL)
          .format,
      ).toBe('atom');
      expect(MAPPED_FEED.format).toBe('rss');
    });

    it('should map an episodic show and a show with no itunesType to isSerial false', () => {
      expect(
        mapPodcastIndexFeed(
          createPodcastIndexFeed({ itunesType: 'episodic' }),
          FEED_URL,
        ).isSerial,
      ).toBe(false);
      expect(MAPPED_FEED.isSerial).toBe(false);
    });

    it('should leave out the empty, null, and non-http values that Podcast Index gives', () => {
      const feed = mapPodcastIndexFeed(
        createPodcastIndexFeed({
          author: '',
          categories: null,
          description: '',
          funding: undefined,
          image: '',
          link: 'javascript:alert(1)',
        }),
        FEED_URL,
      );

      expect(feed.author).toBeUndefined();
      expect(feed.categories).toBeUndefined();
      expect(feed.description).toBeUndefined();
      expect(feed.funding).toBeUndefined();
      expect(feed.image).toBeUndefined();
      expect(feed.link).toBeUndefined();
    });

    it('should use the funding URL as the message when the message is empty', () => {
      expect(
        mapPodcastIndexFeed(
          createPodcastIndexFeed({
            funding: { message: ' ', url: 'https://example.com/donate' },
          }),
          FEED_URL,
        ).funding,
      ).toEqual({
        message: 'https://example.com/donate',
        url: 'https://example.com/donate',
      });
    });
  });

  describe('episodes', () => {
    it('should map the episode fields that the pages render', () => {
      expect(
        mapPodcastIndexEpisode(createPodcastIndexEpisode(), MAPPED_FEED),
      ).toEqual({
        chaptersUrl: 'https://example.com/1/chapters.json',
        datePublished: 1_696_420_740,
        description: '<p>Full description</p>',
        duration: 3723,
        enclosureType: 'audio/mpeg',
        enclosureUrl: 'https://example.com/1.mp3',
        episodeNumber: 3,
        episodeType: 'full',
        explicit: true,
        feedImage: 'https://example.com/show.jpg',
        feedTitle: 'Show Title',
        feedUrl: FEED_URL,
        identity: 'episode-1',
        image: 'https://example.com/1.jpg',
        persons: [
          {
            group: 'cast',
            href: 'https://example.com/jane',
            img: 'https://example.com/jane.jpg',
            name: 'Jane Doe',
            role: 'guest',
          },
        ],
        seasonNumber: 2,
        title: 'Episode One',
        transcripts: [
          { type: 'text/vtt', url: 'https://example.com/1/transcript.vtt' },
        ],
      });
    });

    it('should map an episode of episodes/byfeedid, which has no persons and no transcripts', () => {
      const {
        feedTitle: _feedTitle,
        persons: _persons,
        transcripts: _transcripts,
        ...listEpisode
      } = createPodcastIndexEpisode();
      const episode: Episode = listEpisode;

      expect(mapPodcastIndexEpisode(episode, MAPPED_FEED)).toMatchObject({
        feedTitle: 'Show Title',
        identity: 'episode-1',
        persons: undefined,
        transcripts: undefined,
      });
    });

    it('should trim the guid, with no change of case', () => {
      expect(
        mapPodcastIndexEpisode(
          createPodcastIndexEpisode({ guid: '  Episode-ABC \n' }),
          MAPPED_FEED,
        )?.identity,
      ).toBe('Episode-ABC');
    });

    it('should use the enclosure URL as the identity when the guid is blank', () => {
      expect(
        mapPodcastIndexEpisode(
          createPodcastIndexEpisode({ guid: ' ' }),
          MAPPED_FEED,
        )?.identity,
      ).toBe('https://example.com/1.mp3');
    });

    it('should return undefined when the episode has no guid and no enclosure URL', () => {
      expect(
        mapPodcastIndexEpisode(
          createPodcastIndexEpisode({ enclosureUrl: '', guid: '' }),
          MAPPED_FEED,
        ),
      ).toBeUndefined();
    });

    it('should leave out the zero, null, and empty values that Podcast Index gives', () => {
      const episode = mapPodcastIndexEpisode(
        createPodcastIndexEpisode({
          chaptersUrl: null,
          duration: 0,
          episode: null,
          episodeType: null,
          image: '',
          persons: null,
          season: 0,
          transcripts: null,
        }),
        MAPPED_FEED,
      );

      expect(episode?.chaptersUrl).toBeUndefined();
      expect(episode?.duration).toBeUndefined();
      expect(episode?.episodeNumber).toBeUndefined();
      expect(episode?.episodeType).toBeUndefined();
      expect(episode?.image).toBeUndefined();
      expect(episode?.persons).toBeUndefined();
      expect(episode?.seasonNumber).toBeUndefined();
      expect(episode?.transcripts).toBeUndefined();
    });

    it('should map explicit 0 to false', () => {
      expect(
        mapPodcastIndexEpisode(
          createPodcastIndexEpisode({ explicit: 0 }),
          MAPPED_FEED,
        )?.explicit,
      ).toBe(false);
    });

    it('should use the show image when the episode has no feed image', () => {
      expect(
        mapPodcastIndexEpisode(createPodcastIndexEpisode({ feedImage: '' }), {
          ...MAPPED_FEED,
          image: 'https://example.com/fallback.jpg',
        })?.feedImage,
      ).toBe('https://example.com/fallback.jpg');
    });

    it('should drop a person with no name, and the non-http links of a person', () => {
      expect(
        mapPodcastIndexEpisode(
          createPodcastIndexEpisode({
            persons: [
              { id: 1, name: ' ' },
              {
                href: 'javascript:alert(1)',
                id: 2,
                img: 'data:image/png;base64,AAAA',
                name: 'John Doe',
              },
            ],
          }),
          MAPPED_FEED,
        )?.persons,
      ).toEqual([
        {
          group: undefined,
          href: undefined,
          img: undefined,
          name: 'John Doe',
          role: undefined,
        },
      ]);
    });

    it('should drop a transcript with no type or a non-http URL', () => {
      expect(
        mapPodcastIndexEpisode(
          createPodcastIndexEpisode({
            transcripts: [
              { type: '', url: 'https://example.com/1/a.vtt' },
              { type: 'text/vtt', url: 'file:///etc/passwd' },
              { type: 'application/srt', url: 'https://example.com/1/b.srt' },
            ],
          }),
          MAPPED_FEED,
        )?.transcripts,
      ).toEqual([
        { type: 'application/srt', url: 'https://example.com/1/b.srt' },
      ]);
    });
  });
});

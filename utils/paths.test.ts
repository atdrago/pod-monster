import { decodeFeedUrlSegment } from 'utils/base64Url';

import { getEpisodePath, getPodcastPath } from './paths';

const ATP_FEED_URL = 'https://cdn.atp.fm/rss/public?wtvryzdm';
const ATP_CANONICAL_SEGMENT =
  'aHR0cHM6Ly9jZG4uYXRwLmZtL3Jzcy9wdWJsaWM_d3R2cnl6ZG0';
// The standard base64 form is `ZXBpc29kZT4+PzY1Ng==`.
const GUID = 'episode>>?656';
const GUID_CANONICAL_SEGMENT = 'ZXBpc29kZT4-PzY1Ng';

describe('paths', () => {
  describe('getPodcastPath', () => {
    it('should give the canonical base64url segment of the feed URL', () => {
      expect(getPodcastPath({ feedUrl: ATP_FEED_URL })).toBe(
        `/feeds/${ATP_CANONICAL_SEGMENT}`,
      );
    });

    it('should give one path segment after /feeds/ for a feed URL with a query', () => {
      const path = getPodcastPath({ feedUrl: ATP_FEED_URL });
      const [empty, feeds, feedSegment, ...rest] = path.split('/');

      expect(empty).toBe('');
      expect(feeds).toBe('feeds');
      expect(rest).toEqual([]);
      expect(feedSegment).not.toMatch(/[=+/?]/);
      expect(decodeFeedUrlSegment(feedSegment)).toBe(ATP_FEED_URL);
    });
  });

  describe('getEpisodePath', () => {
    it('should give the canonical base64url segments of the feed URL and the guid', () => {
      expect(
        getEpisodePath({ episodeIdentity: GUID, feedUrl: ATP_FEED_URL }),
      ).toBe(
        `/feeds/${ATP_CANONICAL_SEGMENT}/episodes/${GUID_CANONICAL_SEGMENT}`,
      );
      expect(
        getEpisodePath({ episodeIdentity: GUID, feedUrl: ATP_FEED_URL }),
      ).not.toMatch(/[=+]/);
    });
  });
});

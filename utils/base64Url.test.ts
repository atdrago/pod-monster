import {
  decodeBase64UrlSegment,
  decodeFeedUrlSegment,
  encodeBase64Url,
  isCanonicalBase64UrlSegment,
} from './base64Url';

const ATP_FEED_URL = 'https://cdn.atp.fm/rss/public?wtvryzdm';
const ATP_STANDARD_BASE64 =
  'aHR0cHM6Ly9jZG4uYXRwLmZtL3Jzcy9wdWJsaWM/d3R2cnl6ZG0=';
const ATP_PADDED_BASE64_URL =
  'aHR0cHM6Ly9jZG4uYXRwLmZtL3Jzcy9wdWJsaWM_d3R2cnl6ZG0=';
const ATP_CANONICAL_SEGMENT =
  'aHR0cHM6Ly9jZG4uYXRwLmZtL3Jzcy9wdWJsaWM_d3R2cnl6ZG0';

describe('base64Url', () => {
  describe('encodeBase64Url', () => {
    it('should round trip a feed URL with ASCII only', () => {
      const feedUrl = 'https://feed.foghornhour.example.com/rss.xml';

      expect(encodeBase64Url(feedUrl)).toBe(
        'aHR0cHM6Ly9mZWVkLmZvZ2hvcm5ob3VyLmV4YW1wbGUuY29tL3Jzcy54bWw',
      );
      expect(decodeBase64UrlSegment(encodeBase64Url(feedUrl))).toBe(feedUrl);
    });

    it('should round trip a guid with non-ASCII characters and a space', () => {
      const guid = 'Café episode 🎙️ 12';

      expect(decodeBase64UrlSegment(encodeBase64Url(guid))).toBe(guid);
    });

    it('should round trip a guid with a leading byte order mark', () => {
      const guid = '﻿episode-1';

      expect(decodeBase64UrlSegment(encodeBase64Url(guid))).toBe(guid);
    });

    it('should encode a value whose standard base64 has a slash with no slash, plus, or equals sign', () => {
      expect(btoa(ATP_FEED_URL)).toBe(ATP_STANDARD_BASE64);

      const segment = encodeBase64Url(ATP_FEED_URL);

      expect(segment).toBe(ATP_CANONICAL_SEGMENT);
      expect(segment).not.toMatch(/[/+=]/);
    });

    it('should encode values whose standard base64 has a plus or padding with no plus or equals sign', () => {
      for (const value of [
        'guid-with+slash/and=pad',
        'https://example.com/feed.xml',
        'a?>',
      ]) {
        const segment = encodeBase64Url(value);

        expect(segment).not.toMatch(/[/+=]/);
        expect(decodeBase64UrlSegment(segment)).toBe(value);
      }
    });
  });

  describe('decodeBase64UrlSegment', () => {
    it('should accept the standard base64 form and the padded form of the same value', () => {
      expect(decodeBase64UrlSegment(ATP_STANDARD_BASE64)).toBe(ATP_FEED_URL);
      expect(decodeBase64UrlSegment(ATP_PADDED_BASE64_URL)).toBe(ATP_FEED_URL);
    });

    it('should return null for characters outside of the base64 alphabet', () => {
      expect(decodeBase64UrlSegment('%%%')).toBeNull();
      expect(decodeBase64UrlSegment('ab cd')).toBeNull();
      expect(decodeBase64UrlSegment('ab=cd')).toBeNull();
    });

    it('should return null for an empty string', () => {
      expect(decodeBase64UrlSegment('')).toBeNull();
    });

    it('should return null for a length that no base64 value has', () => {
      expect(decodeBase64UrlSegment('abcde')).toBeNull();
    });

    it('should return null for bytes that are not valid UTF-8', () => {
      expect(decodeBase64UrlSegment('_w')).toBeNull();
      expect(decodeBase64UrlSegment('ww')).toBeNull();
    });

    it('should return null for a segment over 4096 characters with no decode', () => {
      const atobSpy = vi.spyOn(globalThis, 'atob');

      expect(decodeBase64UrlSegment('A'.repeat(5000))).toBeNull();
      expect(atobSpy).not.toHaveBeenCalled();

      atobSpy.mockRestore();
    });

    it('should decode a segment of 4096 characters', () => {
      expect(decodeBase64UrlSegment('QUFB'.repeat(1024))).toBe(
        'AAA'.repeat(1024),
      );
    });
  });

  describe('decodeFeedUrlSegment', () => {
    it('should return an https feed URL', () => {
      expect(decodeFeedUrlSegment(ATP_CANONICAL_SEGMENT)).toBe(ATP_FEED_URL);
    });

    it('should return an http feed URL', () => {
      const feedUrl = 'http://example.com/feed';

      expect(decodeFeedUrlSegment(encodeBase64Url(feedUrl))).toBe(feedUrl);
    });

    it('should return null for an empty value', () => {
      expect(decodeFeedUrlSegment('')).toBeNull();
    });

    it('should return null for a scheme other than http or https', () => {
      expect(
        decodeFeedUrlSegment(encodeBase64Url('ftp://example.com/feed')),
      ).toBeNull();
      expect(
        decodeFeedUrlSegment(encodeBase64Url('javascript:alert(1)')),
      ).toBeNull();
    });

    it('should return null for a value that does not parse as a URL', () => {
      expect(decodeFeedUrlSegment(encodeBase64Url('not a url'))).toBeNull();
    });

    it('should return null for a segment that does not decode', () => {
      expect(decodeFeedUrlSegment('%%%')).toBeNull();
    });

    it('should accept a decoded value of 2048 characters', () => {
      const prefix = 'https://example.com/';
      const feedUrl = prefix + 'a'.repeat(2048 - prefix.length);

      expect(decodeFeedUrlSegment(encodeBase64Url(feedUrl))).toBe(feedUrl);
    });

    it('should return null for a decoded value over 2048 characters', () => {
      const prefix = 'https://example.com/';
      const feedUrl = prefix + 'a'.repeat(2049 - prefix.length);

      expect(decodeFeedUrlSegment(encodeBase64Url(feedUrl))).toBeNull();
    });
  });

  describe('isCanonicalBase64UrlSegment', () => {
    it('should return true for a segment from the encoder', () => {
      expect(isCanonicalBase64UrlSegment(ATP_CANONICAL_SEGMENT)).toBe(true);
    });

    it('should return false for the standard base64 form and the padded form', () => {
      expect(isCanonicalBase64UrlSegment(ATP_STANDARD_BASE64)).toBe(false);
      expect(isCanonicalBase64UrlSegment(ATP_PADDED_BASE64_URL)).toBe(false);
    });

    it('should return false for a segment with extra bits in its last character', () => {
      expect(decodeBase64UrlSegment('QR')).toBe('A');
      expect(isCanonicalBase64UrlSegment('QR')).toBe(false);
    });

    it('should return false for a segment that does not decode', () => {
      expect(isCanonicalBase64UrlSegment('%%%')).toBe(false);
      expect(isCanonicalBase64UrlSegment('')).toBe(false);
    });
  });
});

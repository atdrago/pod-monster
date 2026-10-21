import { normalizeFeedUrl } from 'utils/normalizeFeedUrl';
import { toHttpUrl } from 'utils/toHttpUrl';

// TODO: Use `Uint8Array.fromBase64` and `Uint8Array.prototype.toBase64` with the `base64url`
// alphabet when every supported version of Node.js and Safari has them.

const MAX_SEGMENT_LENGTH = 4096;
const MAX_FEED_URL_LENGTH = 2048;

// The decoder also accepts the standard alphabet and the padding, so an old link still opens.
const BASE64_PATTERN = /^[A-Za-z0-9+/_-]+={0,2}$/;

/**
 * The base64url form (RFC 4648, section 5) of the UTF-8 bytes of a value, with no padding. The
 * native app makes its route segments with the same function, so a segment of the app and a
 * segment of the site are equal.
 */
export function encodeBase64Url(value: string): string {
  const binary = Array.from(new TextEncoder().encode(value), (byte) =>
    String.fromCharCode(byte),
  ).join('');

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function decodeBase64Url(value: string): string | null {
  if (!BASE64_PATTERN.test(value)) {
    return null;
  }

  const standard = value
    .replace(/=+$/, '')
    .replaceAll('-', '+')
    .replaceAll('_', '/');
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);

  try {
    const bytes = Uint8Array.from(atob(padded), (character) =>
      character.charCodeAt(0),
    );

    // `ignoreBOM` keeps a leading byte order mark, so that the decode is the exact inverse of
    // `encodeBase64Url`.
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    return null;
  }
}

/**
 * The value of a route segment, or `null` when the segment is too long, is not base64, or does
 * not hold UTF-8 text.
 */
export function decodeBase64UrlSegment(segment: string): string | null {
  if (segment.length > MAX_SEGMENT_LENGTH) {
    return null;
  }

  return decodeBase64Url(segment);
}

/**
 * The normalized feed URL of a `/feeds/` segment, or `null` when the value is not an `http:` or
 * `https:` URL of at most 2048 characters. The function checks the length of the normalized URL,
 * so the segment of the result decodes to the same URL.
 */
export function decodeFeedUrlSegment(segment: string): string | null {
  const decodedValue = decodeBase64UrlSegment(segment);
  const feedUrl =
    decodedValue === null || toHttpUrl(decodedValue) === undefined
      ? null
      : normalizeFeedUrl(decodedValue);

  return feedUrl === null || feedUrl.length > MAX_FEED_URL_LENGTH
    ? null
    : feedUrl;
}

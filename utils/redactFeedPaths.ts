// A segment runs to the next slash, `?`, `#`, quote, or whitespace. Thus a standard base64 form
// with `+`, `=`, `%2B`, or `%3D` goes too.
const FEED_SEGMENT_PATTERN = /(\/feeds\/)[^/?#\s"'`]+/gi;
const EPISODE_SEGMENT_PATTERN = /(\/episodes\/)[^/?#\s"'`]+/gi;
const URL_QUERY_VALUE_PATTERN = /([?&;](?:feed)?url=)[^&#\s"'`]+/gi;

// The groups are the scheme, the host with its port, and the rest of the URL. The pattern drops a
// user name and a password. The rest stops before the next `http://` or `https://`, so the
// function also cuts a URL inside the query of another URL.
const ABSOLUTE_URL_PATTERN =
  /(https?:\/\/)(?:[^/?#\s"'`<>@]*@)?([^/?#\s"'`<>]*)((?:(?!https?:\/\/)[^\s"'`<>])*)/gi;

/**
 * Replaces each `/feeds/` and `/episodes/` segment with the name of its route parameter, and
 * replaces the value of each `url` and `feedurl` query parameter. A segment is the base64url form
 * of a feed URL or a guid, and a private feed URL holds a member token.
 */
export function redactFeedPaths(text: string): string {
  return text
    .replace(FEED_SEGMENT_PATTERN, '$1[feedUrlBase64]')
    .replace(EPISODE_SEGMENT_PATTERN, '$1[guidBase64]')
    .replace(URL_QUERY_VALUE_PATTERN, '$1[redacted]');
}

function redactSentryText(text: string, siteOrigin: string): string {
  const lowerCaseSiteOrigin = siteOrigin.toLowerCase();

  // An enclosure, image, chapters, or transcript URL can hold a token, so only a URL on the site
  // origin keeps its path.
  const textWithCutUrls = text.replace(
    ABSOLUTE_URL_PATTERN,
    (_match, scheme: string, host: string, rest: string) => {
      const origin = `${scheme}${host}`;

      return origin.toLowerCase() === lowerCaseSiteOrigin
        ? `${origin}${rest}`
        : origin;
    },
  );

  return redactFeedPaths(textWithCutUrls);
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function redactValue(
  value: unknown,
  siteOrigin: string,
  copies: WeakMap<object, unknown>,
): unknown {
  if (typeof value === 'string') {
    return redactSentryText(value, siteOrigin);
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const existingCopy = copies.get(value);

  if (existingCopy !== undefined) {
    return existingCopy;
  }

  if (Array.isArray(value)) {
    const arrayCopy: Array<unknown> = [];

    copies.set(value, arrayCopy);

    for (const item of value) {
      arrayCopy.push(redactValue(item, siteOrigin, copies));
    }

    return arrayCopy;
  }

  // A class instance, for example a DOM node in a raw breadcrumb, stays as it is. Sentry turns
  // it into plain data before `beforeSend`, and the walk then sees its strings.
  if (!isPlainObject(value)) {
    return value;
  }

  const objectCopy: Record<string, unknown> = {};

  copies.set(value, objectCopy);

  for (const [key, item] of Object.entries(value)) {
    objectCopy[redactSentryText(key, siteOrigin)] = redactValue(
      item,
      siteOrigin,
      copies,
    );
  }

  return objectCopy;
}

/**
 * A copy of Sentry data in which every string and every object key goes through
 * `redactFeedPaths`, and every absolute URL that is not on `siteOrigin` is cut to its origin. The
 * function does not change its input, because a raw breadcrumb can hold live objects of the app.
 */
export function redactSentryData<TData>(data: TData, siteOrigin: string): TData;

// The copy has the shape of the input, and only its strings change. Thus the overload above can
// give the type of the input with no type assertion.
export function redactSentryData(data: unknown, siteOrigin: string): unknown {
  return redactValue(data, siteOrigin, new WeakMap());
}

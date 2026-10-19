// This rule is a copy of `mayContainPrivateFeedToken` in `src/utils/shareLink.ts` of the native
// app, and its tests are a copy of the native tests. The site and the app must use one rule, so a
// change to the rule goes into both repositories.

const UUID_SOURCE =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const UUID_PATTERN = new RegExp(UUID_SOURCE, 'i');
const LONG_HEX_RUN_PATTERN = /[0-9a-f]{20,}/i;
const LONG_ALPHANUMERIC_RUN_PATTERN = /[A-Za-z0-9]{20,}/g;

// The rule compares each word of a query key to this list, so `accessToken`, `api_key`, and
// `X-Amz-Signature` match, and `stationCallSign` does not.
const CREDENTIAL_KEY_WORDS = new Set([
  'accesstoken',
  'apikey',
  'auth',
  'authorization',
  'authtoken',
  'credential',
  'credentials',
  'jwt',
  'key',
  'passwd',
  'password',
  'pwd',
  'secret',
  'sig',
  'signature',
  'token',
]);

/**
 * Layer 1 of the rule: a host or a path that serves only member feeds.
 *
 * - `atp.fm/rss/<id>` is the ATP member feed. The public feed is `atp.fm/rss`, which redirects
 *   to `cdn.atp.fm/rss/public?<cache key>`, so `cdn.atp.fm` is not a member host.
 * - Patreon serves member feeds at `/rss/<creator>?auth=<token>`.
 * - The other hosts and paths come from the private feed block list of Podcast Index. Their
 *   member tokens can be shorter than the shapes of layer 4.
 */
const MEMBER_FEED_DOMAINS: ReadonlyArray<string> = [
  'supercast.com',
  'supercast.tech',
  'supportingcast.cc',
  'supportingcast.co',
  'supportingcast.fm',
];
const MEMBER_FEED_HOSTNAMES = new Set([
  'access.acast.com',
  'private.captivate.fm',
  'subscribers.transistor.fm',
]);

function isWithinDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

function isMemberFeedLocation(hostname: string, pathname: string): boolean {
  if (hostname === 'atp.fm' || hostname === 'www.atp.fm') {
    return /^\/rss\/[^/]+/i.test(pathname);
  }

  if (hostname === 'patreon.com' || hostname === 'www.patreon.com') {
    return /^\/rss\//i.test(pathname);
  }

  if (hostname === 'pinecast.com' || hostname === 'www.pinecast.com') {
    return /^\/feed\/[^/]+\/sub\//i.test(pathname);
  }

  if (hostname === 'my.slate.com') {
    return /^\/subscriptions\//i.test(pathname);
  }

  if (hostname === 'anchor.fm') {
    return /\/podcast\/auth\//i.test(pathname);
  }

  return (
    MEMBER_FEED_HOSTNAMES.has(hostname) ||
    MEMBER_FEED_DOMAINS.some((domain) => isWithinDomain(hostname, domain))
  );
}

/**
 * Layer 2 of the rule: the public path shape of a host that puts an id into each public feed
 * URL. A path that matches skips layer 4, and the query still goes through layer 3. Each member
 * form of these hosts still flags: an Acast member feed is on `access.acast.com`, an Omny Studio
 * member feed is on `omny.fm` and has a member token, and a RedCircle private feed adds
 * `/pf/<token>`. Flightcast documents only public feeds.
 */
const PUBLIC_FEED_SHAPES: ReadonlyArray<{
  hostnames: ReadonlyArray<string>;
  path: RegExp;
}> = [
  {
    hostnames: ['serve.podhome.fm'],
    path: new RegExp(`^/rss/${UUID_SOURCE}/?$`, 'i'),
  },
  { hostnames: ['rss2.flightcast.com'], path: /^\/[a-z0-9]{24}(\.xml)?\/?$/ },
  { hostnames: ['feeds.fountain.fm'], path: /^\/[A-Za-z0-9]{20}\/?$/ },
  {
    hostnames: ['wavlake.com', 'www.wavlake.com'],
    path: new RegExp(`^/feed/((music|show)/)?${UUID_SOURCE}/?$`, 'i'),
  },
  {
    hostnames: ['omnycontent.com', 'www.omnycontent.com'],
    path: new RegExp(
      `^/d/playlist/${UUID_SOURCE}/${UUID_SOURCE}/${UUID_SOURCE}/podcast\\.rss$`,
      'i',
    ),
  },
  {
    hostnames: ['feeds.redcircle.com'],
    path: new RegExp(`^/${UUID_SOURCE}/?$`, 'i'),
  },
  {
    hostnames: ['feeds.acast.com'],
    path: new RegExp(`^/public/shows/(${UUID_SOURCE}|[0-9a-f]{24})/?$`, 'i'),
  },
];

function hasPublicFeedShape(hostname: string, pathname: string): boolean {
  return PUBLIC_FEED_SHAPES.some(
    (shape) => shape.hostnames.includes(hostname) && shape.path.test(pathname),
  );
}

function decodeOrKeep(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

// A dot or a hyphen ends a run, so a feed extension never joins a token, and a slug of words
// never makes a long run.
function looksLikeSecret(text: string): boolean {
  if (UUID_PATTERN.test(text) || LONG_HEX_RUN_PATTERN.test(text)) {
    return true;
  }

  return (text.match(LONG_ALPHANUMERIC_RUN_PATTERN) ?? []).some(
    (run) => /[0-9]/.test(run) && /[A-Za-z]/.test(run),
  );
}

function isCredentialKey(key: string): boolean {
  return key
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .some((word) => CREDENTIAL_KEY_WORDS.has(word));
}

// Layer 3 of the rule. The function splits the query by hand, so the result does not depend on
// the `URLSearchParams` of the runtime.
function queryMayContainToken(search: string): boolean {
  const query = search.startsWith('?') ? search.slice(1) : search;

  if (query === '') {
    return false;
  }

  if (!query.includes('=')) {
    return true;
  }

  return query.split('&').some((part) => {
    const separatorIndex = part.indexOf('=');

    if (separatorIndex === -1) {
      return looksLikeSecret(decodeOrKeep(part));
    }

    return (
      isCredentialKey(decodeOrKeep(part.slice(0, separatorIndex))) ||
      looksLikeSecret(decodeOrKeep(part.slice(separatorIndex + 1)))
    );
  });
}

// Layer 4 of the rule.
function pathMayContainToken(pathname: string): boolean {
  return pathname.split('/').some((encodedSegment) => {
    const segment = decodeOrKeep(encodedSegment);

    return segment.toLowerCase() === 'private' || looksLikeSecret(segment);
  });
}

/**
 * True when a feed URL can hold credentials or a private member token. Then the site does not
 * send the URL to Podcast Index, and the page tells search engines not to index it. The rule
 * aims for no false flag on a public feed. A false negative can spread a paid feed token, so a
 * URL that does not parse flags (layer 5).
 */
export function isPrivateFeedUrl(feedUrl: string): boolean {
  let url: URL;

  try {
    url = new URL(feedUrl);
  } catch {
    return true;
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const { pathname } = url;

  if (hostname === '') {
    return true;
  }

  if (url.username !== '' || url.password !== '') {
    return true;
  }

  if (isMemberFeedLocation(hostname, pathname)) {
    return true;
  }

  if (queryMayContainToken(url.search)) {
    return true;
  }

  if (hasPublicFeedShape(hostname, pathname)) {
    return false;
  }

  return pathMayContainToken(pathname);
}

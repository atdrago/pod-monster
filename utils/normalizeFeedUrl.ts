/**
 * The one form of a feed URL that the library keys and the `/feeds/` paths
 * use, or `null` for a value that does not parse. The parse lowercases the
 * scheme and the host, and removes a default port. The path and the query keep
 * their case, because a feed token is case sensitive. A fragment never reaches
 * the server of the feed, so the function removes it.
 */
export const normalizeFeedUrl = (feedUrl: string): string | null => {
  if (!URL.canParse(feedUrl)) {
    return null;
  }

  const url = new URL(feedUrl);

  url.hash = '';

  return url.href;
};

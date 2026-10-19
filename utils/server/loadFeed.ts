import 'server-only';

import { captureMessage } from '@sentry/nextjs';
import { cache } from 'react';

import {
  episodeByGuid,
  episodesByFeedId,
  getAuthValues,
  NetworkError,
  type PodcastIndexConfig,
  podcastsByFeedUrl,
} from '@atdrago/podcast-index';
import type { PodcastEpisode, PodcastFeed } from 'types/PodcastFeed';
import { decodeBase64UrlSegment, decodeFeedUrlSegment } from 'utils/base64Url';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { isPrivateFeedUrl } from 'utils/isPrivateFeedUrl';
import { FeedUnavailableError } from 'utils/server/FeedUnavailableError';
import {
  mapPodcastIndexEpisode,
  mapPodcastIndexFeed,
} from 'utils/server/mapPodcastIndexFeed';
import { parseRssFeed } from 'utils/server/parseRssFeed';
import { safeFetchFeed } from 'utils/server/safeFetchFeed';

type FeedSource = 'podcastIndex' | 'rss';

interface LoadedFeed {
  feed: PodcastFeed;
  isPrivate: boolean;
  kind: 'found';
  source: FeedSource;
}

interface NotFound {
  kind: 'not_found';
}

type LoadShowResult =
  | (LoadedFeed & { episodes: Array<PodcastEpisode> })
  | NotFound;

type LoadEpisodeResult = (LoadedFeed & { episode: PodcastEpisode }) | NotFound;

type ParsedRssFeed = Extract<ReturnType<typeof parseRssFeed>, { kind: 'feed' }>;

type SafeFetchFailure = Extract<
  Awaited<ReturnType<typeof safeFetchFeed>>,
  { kind: 'error' }
>;

type PodcastIndexEndpoint =
  | 'episodes/byfeedid'
  | 'episodes/byguid'
  | 'podcasts/byfeedurl';

const NOT_FOUND: NotFound = { kind: 'not_found' };
const RSS_SHOW_EPISODE_LIMIT = 100;
const PODCAST_INDEX_CONFIGURATION_STATUSES = new Set([400, 401]);
const TRANSIENT_FEED_STATUSES = new Set([408, 429]);

/**
 * Loads a show page from the `/feeds/<feed>` segment. A transient RSS failure
 * throws `FeedUnavailableError`. Any other miss gives the `not_found` result.
 */
export const loadShow = cache(
  async (feedUrlBase64: string): Promise<LoadShowResult> => {
    const feedUrl = decodeLoadableFeedUrl(feedUrlBase64);

    if (feedUrl === null) {
      return NOT_FOUND;
    }

    const isPrivate = isPrivateFeedUrl(feedUrl);
    const config = isPrivate ? undefined : createPodcastIndexConfig();
    const podcastIndexFeed =
      config === undefined
        ? undefined
        : await fetchPodcastIndexFeed(feedUrl, config);

    if (config !== undefined && podcastIndexFeed !== undefined) {
      const episodes = await fetchPodcastIndexEpisodes(
        podcastIndexFeed,
        config,
      );

      if (episodes !== undefined) {
        return {
          episodes,
          feed: podcastIndexFeed,
          isPrivate,
          kind: 'found',
          source: 'podcastIndex',
        };
      }
    }

    const rssFeed = await readRssFeed(feedUrl);

    if (rssFeed === undefined) {
      return NOT_FOUND;
    }

    return {
      episodes: rssFeed.episodes
        .toSorted(
          (left, right) =>
            (right.datePublished ?? 0) - (left.datePublished ?? 0),
        )
        .slice(0, RSS_SHOW_EPISODE_LIMIT),
      feed: {
        ...rssFeed.feed,
        podcastIndexId: podcastIndexFeed?.podcastIndexId,
      },
      isPrivate,
      kind: 'found',
      source: 'rss',
    };
  },
);

/**
 * Loads an episode page from the `/feeds/<feed>/episodes/<episode>` segments.
 * The RSS fallback searches every episode of the feed, not only the 100
 * newest.
 */
export const loadEpisode = cache(
  async (
    feedUrlBase64: string,
    guidBase64: string,
  ): Promise<LoadEpisodeResult> => {
    const feedUrl = decodeLoadableFeedUrl(feedUrlBase64);
    const identity = decodeBase64UrlSegment(guidBase64);

    // An identity is trimmed and not empty, so no episode matches any other
    // value.
    if (feedUrl === null || identity === null || !isIdentity(identity)) {
      return NOT_FOUND;
    }

    const isPrivate = isPrivateFeedUrl(feedUrl);
    const config = isPrivate ? undefined : createPodcastIndexConfig();
    const podcastIndexFeed =
      config === undefined
        ? undefined
        : await fetchPodcastIndexFeed(feedUrl, config);

    if (config !== undefined && podcastIndexFeed !== undefined) {
      const episode = await fetchPodcastIndexEpisode(
        identity,
        podcastIndexFeed,
        config,
      );

      if (episode !== undefined) {
        return {
          episode,
          feed: podcastIndexFeed,
          isPrivate,
          kind: 'found',
          source: 'podcastIndex',
        };
      }
    }

    const rssFeed = await readRssFeed(feedUrl);
    const episode = rssFeed?.episodes.find(
      (candidate) => candidate.identity === identity,
    );

    if (rssFeed === undefined || episode === undefined) {
      return NOT_FOUND;
    }

    return {
      episode,
      feed: {
        ...rssFeed.feed,
        podcastIndexId: podcastIndexFeed?.podcastIndexId,
      },
      isPrivate,
      kind: 'found',
      source: 'rss',
    };
  },
);

/**
 * The feed URL of a segment, or `null` for a segment that does not decode, and
 * for a URL with a user name or a password. Such a URL must not reach Podcast
 * Index, and the feed guard blocks it too.
 */
function decodeLoadableFeedUrl(feedUrlBase64: string): string | null {
  const feedUrl = decodeFeedUrlSegment(feedUrlBase64);

  if (feedUrl === null) {
    return null;
  }

  const { password, username } = new URL(feedUrl);

  return username === '' && password === '' ? feedUrl : null;
}

function isIdentity(value: string): boolean {
  return value !== '' && value.trim() === value;
}

function createPodcastIndexConfig(): PodcastIndexConfig | undefined {
  const apiKey = process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET;

  // The declared type of each variable is `string`, but a deploy or a local
  // checkout can leave it out. `getAuthValues` then throws, and the RSS
  // fallback does not run.
  if (!apiKey || !apiSecret) {
    captureMessage('podcast_index_auth_failed', {
      extra: { reason: 'missing_credentials', source: 'podcastIndex' },
      level: 'error',
    });

    return undefined;
  }

  const [authTime, authToken] = getAuthValues(apiKey, apiSecret);

  return getPodcastIndexConfig(authTime, authToken);
}

async function fetchPodcastIndexFeed(
  feedUrl: string,
  config: PodcastIndexConfig,
): Promise<PodcastFeed | undefined> {
  try {
    const response = await podcastsByFeedUrl(feedUrl, config);
    const untypedResponse: unknown = response;

    // A feed that Podcast Index does not know is `[]` or `{}`.
    return isSuccess(untypedResponse) &&
      isRecord(untypedResponse.feed) &&
      typeof untypedResponse.feed.id === 'number'
      ? mapPodcastIndexFeed(response.feed, feedUrl)
      : undefined;
  } catch (error) {
    logPodcastIndexFailure('podcasts/byfeedurl', error);

    return undefined;
  }
}

/**
 * The newest 100 episodes, or `undefined` when the list fails or is empty. An
 * empty list can mean that Podcast Index did not crawl the feed yet, so the
 * RSS feed gives a better page.
 */
async function fetchPodcastIndexEpisodes(
  feed: PodcastFeed,
  config: PodcastIndexConfig,
): Promise<Array<PodcastEpisode> | undefined> {
  if (feed.podcastIndexId === undefined) {
    return undefined;
  }

  try {
    const response = await episodesByFeedId(
      `${feed.podcastIndexId}`,
      {},
      config,
    );
    const untypedResponse: unknown = response;

    if (!isSuccess(untypedResponse) || !Array.isArray(untypedResponse.items)) {
      return undefined;
    }

    const seenIdentities = new Set<string>();
    // The first episode of each identity wins, the same as in the RSS parser.
    // Two episodes with one identity have one path, and they give duplicate
    // React keys in the episode list.
    const episodes = response.items.flatMap((item) => {
      const episode = mapPodcastIndexEpisode(item, feed);

      if (episode === undefined || seenIdentities.has(episode.identity)) {
        return [];
      }

      seenIdentities.add(episode.identity);

      return [episode];
    });

    return episodes.length > 0 ? episodes : undefined;
  } catch (error) {
    logPodcastIndexFailure('episodes/byfeedid', error);

    return undefined;
  }
}

async function fetchPodcastIndexEpisode(
  identity: string,
  feed: PodcastFeed,
  config: PodcastIndexConfig,
): Promise<PodcastEpisode | undefined> {
  try {
    const response = await episodeByGuid(identity, feed.url, config);
    const untypedResponse: unknown = response;

    // An episode that Podcast Index does not know is `[]`. An episode with
    // another identity must not show on this path.
    if (!isSuccess(untypedResponse) || !isRecord(untypedResponse.episode)) {
      return undefined;
    }

    const episode = mapPodcastIndexEpisode(response.episode, feed);

    return episode?.identity === identity ? episode : undefined;
  } catch (error) {
    logPodcastIndexFailure('episodes/byguid', error);

    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSuccess(response: unknown): response is Record<string, unknown> {
  return isRecord(response) && response.status === 'true';
}

/**
 * Logs a failed Podcast Index call with safe fields only. The error itself is
 * not logged, because the text of a native fetch error can hold the request
 * URL, and the query of that URL holds the feed URL or the guid.
 */
function logPodcastIndexFailure(
  endpoint: PodcastIndexEndpoint,
  error: unknown,
): void {
  const status = error instanceof NetworkError ? error.status : undefined;
  const isConfigurationError =
    status !== undefined && PODCAST_INDEX_CONFIGURATION_STATUSES.has(status);

  captureMessage(
    isConfigurationError
      ? 'podcast_index_auth_failed'
      : 'podcast_index_unavailable',
    {
      extra: {
        endpoint,
        reason: toPodcastIndexFailureReason(error),
        source: 'podcastIndex',
        status,
      },
      level: isConfigurationError ? 'error' : 'warning',
    },
  );
}

function toPodcastIndexFailureReason(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'http_status';
  }

  if (
    error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  ) {
    return 'timeout';
  }

  if (error instanceof TypeError) {
    return 'network';
  }

  if (error instanceof SyntaxError) {
    return 'invalid_response';
  }

  return 'unknown';
}

/**
 * Reads and parses the RSS feed. Returns `undefined` for a miss that the page
 * shows as not-found, and throws `FeedUnavailableError` for a transient
 * failure. The guard and the parser log their own failures.
 */
async function readRssFeed(
  feedUrl: string,
): Promise<ParsedRssFeed | undefined> {
  const fetchResult = await safeFetchFeed(feedUrl);

  if (fetchResult.kind === 'error') {
    const transientReason = toTransientReason(fetchResult);

    if (transientReason !== undefined) {
      throw new FeedUnavailableError(transientReason);
    }

    return undefined;
  }

  const parseResult = parseRssFeed(fetchResult.body, feedUrl);

  return parseResult.kind === 'feed' ? parseResult : undefined;
}

function toTransientReason({
  reason,
  status,
}: SafeFetchFailure): FeedUnavailableError['reason'] | undefined {
  switch (reason) {
    case 'network':
    case 'timeout':
    case 'too_large':
      return reason;
    case 'http_status':
      return status !== undefined &&
        (status >= 500 || TRANSIENT_FEED_STATUSES.has(status))
        ? reason
        : undefined;
    default:
      return undefined;
  }
}

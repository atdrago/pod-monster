import { captureMessage } from '@sentry/nextjs';

import {
  episodeById,
  getAuthValues,
  NetworkError,
  type PodcastIndexConfig,
  podcastsByFeedId,
} from '@atdrago/podcast-index';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getEpisodePath } from 'utils/paths';
import {
  mapPodcastIndexEpisode,
  mapPodcastIndexFeed,
} from 'utils/server/mapPodcastIndexFeed';

interface EpisodeRouteContext {
  params: Promise<{ episodeId: string; feedId: string }>;
}

type PodcastIndexEndpoint = 'episodes/byid' | 'podcasts/byfeedid';

type PodcastIndexEpisode = Awaited<ReturnType<typeof episodeById>>['episode'];

type PodcastIndexFeed = Awaited<ReturnType<typeof podcastsByFeedId>>['feed'];

const PODCAST_INDEX_ID_PATTERN = /^\d+$/;
const PODCAST_INDEX_CONFIGURATION_STATUSES = new Set([400, 401]);

/**
 * Redirects an old `/podcasts/<feedId>/episodes/<episodeId>` link to the
 * `/feeds/` path of the same episode (KTD11). The feed comes from the episode,
 * so the feed id of the path only needs to be numeric. A 503 for a Podcast
 * Index outage keeps the old page in search indexes, but a 404 does not.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- Next.js routes a request by the name of the HTTP method.
export async function GET(
  request: Request,
  { params }: EpisodeRouteContext,
): Promise<Response> {
  const { episodeId, feedId } = await params;

  if (
    !PODCAST_INDEX_ID_PATTERN.test(feedId) ||
    !PODCAST_INDEX_ID_PATTERN.test(episodeId)
  ) {
    return new Response(null, { status: 404 });
  }

  const config = createPodcastIndexConfig();

  if (config === undefined) {
    return new Response(null, { status: 503 });
  }

  let episode: PodcastIndexEpisode | undefined;

  try {
    episode = await fetchEpisode(episodeId, config);
  } catch (error) {
    logPodcastIndexFailure('episodes/byid', error);

    return new Response(null, { status: 503 });
  }

  if (episode === undefined || typeof episode.feedId !== 'number') {
    return new Response(null, { status: 404 });
  }

  let feed: PodcastIndexFeed | undefined;

  try {
    feed = await fetchFeed(`${episode.feedId}`, config);
  } catch (error) {
    logPodcastIndexFailure('podcasts/byfeedid', error);

    return new Response(null, { status: 503 });
  }

  if (feed === undefined || typeof feed.url !== 'string' || feed.url === '') {
    return new Response(null, { status: 404 });
  }

  // The episode page maps its episode with the same function, so the page
  // finds the episode by the identity in this path.
  const mappedEpisode = mapPodcastIndexEpisode(
    episode,
    mapPodcastIndexFeed(feed, feed.url),
  );

  if (mappedEpisode === undefined) {
    return new Response(null, { status: 404 });
  }

  const redirectUrl = new URL(request.url);

  redirectUrl.pathname = getEpisodePath({
    episodeIdentity: mappedEpisode.identity,
    feedUrl: feed.url,
  });

  return Response.redirect(redirectUrl, 308);
}

function createPodcastIndexConfig(): PodcastIndexConfig | undefined {
  const apiKey = process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY;
  const apiSecret = process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET;

  // The declared type of each variable is `string`, but a deploy or a local
  // checkout can leave it out, and `getAuthValues` then throws.
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

/**
 * An episode that Podcast Index does not know is `[]`.
 */
async function fetchEpisode(
  episodeId: string,
  config: PodcastIndexConfig,
): Promise<PodcastIndexEpisode | undefined> {
  const response = await episodeById(episodeId, config);
  const untypedResponse: unknown = response;

  return isSuccess(untypedResponse) && isRecord(untypedResponse.episode)
    ? response.episode
    : undefined;
}

/**
 * A feed that Podcast Index does not know is `[]` or `{}`.
 */
async function fetchFeed(
  feedId: string,
  config: PodcastIndexConfig,
): Promise<PodcastIndexFeed | undefined> {
  const response = await podcastsByFeedId(feedId, config);
  const untypedResponse: unknown = response;

  return isSuccess(untypedResponse) && isRecord(untypedResponse.feed)
    ? response.feed
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSuccess(response: unknown): response is Record<string, unknown> {
  return isRecord(response) && response.status === 'true';
}

/**
 * Logs a failed Podcast Index call with safe fields only. The function does
 * not log the error itself, because the text of a native fetch error can hold
 * the request URL.
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

  if (error instanceof Error && error.name === 'TimeoutError') {
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

import { captureMessage } from '@sentry/nextjs';

import {
  getAuthValues,
  NetworkError,
  type PodcastIndexConfig,
  podcastsByFeedId,
} from '@atdrago/podcast-index';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getPodcastPath } from 'utils/paths';

interface ShowRouteContext {
  params: Promise<{ feedId: string }>;
}

type PodcastIndexFeed = Awaited<ReturnType<typeof podcastsByFeedId>>['feed'];

const PODCAST_INDEX_ID_PATTERN = /^\d+$/;
const PODCAST_INDEX_CONFIGURATION_STATUSES = new Set([400, 401]);

/**
 * Redirects an old `/podcasts/<feedId>` link to the `/feeds/` path of the same
 * show (KTD11). A 503 for a Podcast Index outage keeps the old page in search
 * indexes, but a 404 does not.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- Next.js routes a request by the name of the HTTP method.
export async function GET(
  request: Request,
  { params }: ShowRouteContext,
): Promise<Response> {
  const { feedId } = await params;

  if (!PODCAST_INDEX_ID_PATTERN.test(feedId)) {
    return new Response(null, { status: 404 });
  }

  const config = createPodcastIndexConfig();

  if (config === undefined) {
    return new Response(null, { status: 503 });
  }

  let feed: PodcastIndexFeed | undefined;

  try {
    feed = await fetchFeed(feedId, config);
  } catch (error) {
    logPodcastIndexFailure(error);

    return new Response(null, { status: 503 });
  }

  if (feed === undefined || typeof feed.url !== 'string' || feed.url === '') {
    return new Response(null, { status: 404 });
  }

  const redirectUrl = new URL(request.url);

  redirectUrl.pathname = getPodcastPath({ feedUrl: feed.url });

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
function logPodcastIndexFailure(error: unknown): void {
  const status = error instanceof NetworkError ? error.status : undefined;
  const isConfigurationError =
    status !== undefined && PODCAST_INDEX_CONFIGURATION_STATUSES.has(status);

  captureMessage(
    isConfigurationError
      ? 'podcast_index_auth_failed'
      : 'podcast_index_unavailable',
    {
      extra: {
        endpoint: 'podcasts/byfeedid',
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

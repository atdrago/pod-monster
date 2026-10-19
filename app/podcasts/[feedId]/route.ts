import {
  type PodcastIndexConfig,
  podcastsByFeedId,
} from '@atdrago/podcast-index';
import { getPodcastPath } from 'utils/paths';
import {
  createPodcastIndexConfig,
  isRecord,
  isSuccess,
  logPodcastIndexFailure,
  PODCAST_INDEX_ID_PATTERN,
} from 'utils/server/podcastIndex';

interface ShowRouteContext {
  params: Promise<{ feedId: string }>;
}

type PodcastIndexFeed = Awaited<ReturnType<typeof podcastsByFeedId>>['feed'];

/**
 * Redirects an old `/podcasts/<feedId>` link to the `/feeds/` path of the same
 * show. A 503 for a Podcast Index outage keeps the old page in search indexes,
 * but a 404 does not.
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
    logPodcastIndexFailure('podcasts/byfeedid', error);

    return new Response(null, { status: 503 });
  }

  if (feed === undefined || typeof feed.url !== 'string' || feed.url === '') {
    return new Response(null, { status: 404 });
  }

  const redirectUrl = new URL(request.url);

  redirectUrl.pathname = getPodcastPath({ feedUrl: feed.url });

  return Response.redirect(redirectUrl, 308);
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

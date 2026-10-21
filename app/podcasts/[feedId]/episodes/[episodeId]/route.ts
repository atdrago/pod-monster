import { episodeById, type PodcastIndexConfig } from '@atdrago/podcast-index';
import { getEpisodePath } from 'utils/paths';
import {
  mapPodcastIndexEpisode,
  mapPodcastIndexFeed,
} from 'utils/server/mapPodcastIndexFeed';
import {
  createPodcastIndexConfig,
  fetchPodcastIndexFeedById,
  isRecord,
  isSuccess,
  logPodcastIndexFailure,
  PODCAST_INDEX_ID_PATTERN,
  type PodcastIndexFeed,
} from 'utils/server/podcastIndex';

interface EpisodeRouteContext {
  params: Promise<{ episodeId: string; feedId: string }>;
}

type PodcastIndexEpisode = Awaited<ReturnType<typeof episodeById>>['episode'];

/**
 * Redirects an old `/podcasts/<feedId>/episodes/<episodeId>` link to the
 * `/feeds/` path of the same episode. The feed comes from the episode, so the
 * feed id of the path only needs to be numeric. A 503 for a Podcast Index
 * outage keeps the old page in search indexes, but a 404 does not.
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
    feed = await fetchPodcastIndexFeedById(`${episode.feedId}`, config);
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

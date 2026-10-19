import type { ApiResponse } from 'podcastdx-client/src/types';

import { request } from 'utils/request';

/**
 * Takes Podcast Index feed ids only, so that no feed URL goes into the query
 * string of the request.
 */
export const fetchPodcastEpisodes = async (
  podcastIndexFeedIds: Array<number>,
  since: number,
): Promise<ApiResponse.EpisodesByFeedId> => {
  if (podcastIndexFeedIds.length === 0) {
    throw new Error('`podcastIndexFeedIds` is required');
  }

  if (!since) {
    throw new Error('`since` is required');
  }

  const episodesProxyUrl = new URL(
    '/api/podcasts/episodes',
    process.env.NEXT_PUBLIC_BASE_URL,
  );

  episodesProxyUrl.searchParams.set('feedId', podcastIndexFeedIds.join(','));
  episodesProxyUrl.searchParams.set('since', `${since}`);

  return await request<ApiResponse.EpisodesByFeedId>(
    episodesProxyUrl.toString(),
    {
      method: 'GET',
    },
  );
};

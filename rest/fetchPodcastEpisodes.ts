import type { ApiResponse } from 'podcastdx-client/src/types';

import { request } from 'utils/request';

export const fetchPodcastEpisodes = async (
  feedId: string,
  since: number
): Promise<ApiResponse.EpisodesByFeedId> => {
  if (!feedId) {
    throw new Error('`feedId` is required');
  }

  if (!since) {
    throw new Error('`since` is required');
  }

  const episodesProxyUrl = new URL(
    '/api/podcasts/episodes',
    process.env.NEXT_PUBLIC_BASE_URL
  );

  episodesProxyUrl.searchParams.set('feedId', feedId);
  episodesProxyUrl.searchParams.set('since', `${since}`);

  return await request<ApiResponse.EpisodesByFeedId>(
    episodesProxyUrl.toString(),
    {
      method: 'GET',
    }
  );
};

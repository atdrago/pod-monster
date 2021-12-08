import type { ApiResponse } from 'podcastdx-client/src/types';

export const fetchPodcastEpisodes = async (
  feedId: string,
  since: number
): Promise<ApiResponse.EpisodesByFeedId | null> => {
  if (!feedId || !since) {
    return null;
  }

  try {
    const episodesProxyUrl = new URL(
      '/api/podcasts/episodes',
      process.env.NEXT_PUBLIC_BASE_URL
    );

    episodesProxyUrl.searchParams.set('feedId', feedId);
    episodesProxyUrl.searchParams.set('since', `${since}`);

    const episodesResponse = await fetch(episodesProxyUrl.toString(), {
      method: 'GET',
    });

    if (!episodesResponse.ok) {
      throw new Error('no k');
    }

    return await episodesResponse.json();
  } catch (err) {
    // TODO: Capture exception

    return null;
  }
};

import type { ApiResponse, PIApiEpisodeInfo } from 'podcastdx-client/src/types';

import { BASE_API_URL, PATH_EPISODES_BY_FEED_ID } from './constants';
import { getHeaders } from './getHeaders';
import type { PodcastIndexConfig } from './types';
import { request } from './utils/request';

export interface Episode extends PIApiEpisodeInfo {
  episodeType: 'trailer' | 'full' | string | null;
}

interface EpisodesByFeedId extends ApiResponse.EpisodesByFeedId {
  items: Array<Episode>;
}

export async function episodesByFeedId(
  id: string,
  {
    max = 100,
    since,
  }: {
    max?: number;
    since?: number;
  } = {},
  config: PodcastIndexConfig,
): Promise<EpisodesByFeedId> {
  const url = new URL(PATH_EPISODES_BY_FEED_ID, BASE_API_URL);
  url.searchParams.set('id', id);
  url.searchParams.set('max', `${max}`);

  if (since) {
    url.searchParams.set('since', `${since}`);
  }

  const httpOptions = {
    headers: getHeaders(config),
    method: 'get',
  };

  return await request<ApiResponse.EpisodesByFeedId>(
    url.toString(),
    httpOptions,
  );
}

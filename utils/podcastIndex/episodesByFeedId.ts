import type { ApiResponse } from 'podcastdx-client/src/types';

import { http } from 'utils/http';

import { assertConfig, getConfig } from './config';
import { BASE_API_URL, PATH_EPISODES_BY_FEED_ID } from './constants';
import { getHeaders } from './getHeaders';
import type { IPodcastIndexConfig } from './types';

export async function episodesByFeedId(
  id: string,
  {
    max = 10,
    since,
  }: {
    max?: number;
    since?: number;
  } = {},
  config: IPodcastIndexConfig | null = getConfig()
): Promise<ApiResponse.EpisodesByFeedId> {
  assertConfig('episodesByFeedId', config);

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

  return await http<ApiResponse.EpisodesByFeedId>(url.toString(), httpOptions);
}

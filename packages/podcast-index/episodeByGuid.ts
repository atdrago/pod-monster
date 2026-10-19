import type { ApiResponse } from 'podcastdx-client/src/types';

import { BASE_API_URL, PATH_EPISODES_BY_GUID } from './constants';
import { getHeaders } from './getHeaders';
import type { PodcastIndexConfig } from './types';
import { request } from './utils/request';

export async function episodeByGuid(
  guid: string,
  feedUrl: string,
  config: PodcastIndexConfig,
): Promise<ApiResponse.EpisodeById> {
  const url = new URL(PATH_EPISODES_BY_GUID, BASE_API_URL);
  url.searchParams.set('guid', guid);
  url.searchParams.set('feedurl', feedUrl);
  url.searchParams.set('fulltext', 'true');

  const httpOptions = {
    headers: getHeaders(config),
    method: 'get',
  };

  return await request<ApiResponse.EpisodeById>(url.toString(), httpOptions);
}

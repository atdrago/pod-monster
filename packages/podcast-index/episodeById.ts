import type { ApiResponse } from 'podcastdx-client/src/types';

import { BASE_API_URL, PATH_EPISODES_BY_ID } from './constants';
import { getHeaders } from './getHeaders';
import type { IPodcastIndexConfig } from './types';
import { request } from './utils/request';

export async function episodeById(
  id: string,
  config: IPodcastIndexConfig,
): Promise<ApiResponse.EpisodeById> {
  const url = new URL(PATH_EPISODES_BY_ID, BASE_API_URL);
  url.searchParams.set('id', id);
  url.searchParams.set('fulltext', 'true');

  const httpOptions = {
    headers: getHeaders(config),
    method: 'get',
  };

  return await request<ApiResponse.EpisodeById>(url.toString(), httpOptions);
}

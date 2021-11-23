import type { ApiResponse } from 'podcastdx-client/src/types';

import { http } from 'utils/http';

import { assertConfig, getConfig } from './config';
import { BASE_API_URL, PATH_EPISODES_BY_ID } from './constants';
import { getHeaders } from './getHeaders';
import type { IPodcastIndexConfig } from './types';

export async function episodeById(
  id: string,
  config: IPodcastIndexConfig | null = getConfig()
): Promise<ApiResponse.EpisodeById> {
  assertConfig('episodeById', config);

  const url = new URL(PATH_EPISODES_BY_ID, BASE_API_URL);
  url.searchParams.set('id', id);
  url.searchParams.set('fulltext', 'true');

  const httpOptions = {
    headers: getHeaders(config),
    method: 'get',
  };

  return await http<ApiResponse.EpisodeById>(url.toString(), httpOptions);
}

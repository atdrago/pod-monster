import type { ApiResponse } from 'podcastdx-client/src/types';

import { BASE_API_URL, PATH_PODCASTS_BY_FEED_ID } from './constants';
import { getHeaders } from './getHeaders';
import type { IPodcastIndexConfig } from './types';
import { http } from './utils/http';

export async function podcastsByFeedId(
  id: string,
  config: IPodcastIndexConfig
): Promise<ApiResponse.PodcastById> {
  const url = new URL(PATH_PODCASTS_BY_FEED_ID, BASE_API_URL);
  url.searchParams.set('id', id);

  const options = {
    headers: getHeaders(config),
    method: 'get',
  };

  return await http<ApiResponse.PodcastById>(url.toString(), options);
}

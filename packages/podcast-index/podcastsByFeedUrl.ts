import type { ApiResponse } from 'podcastdx-client/src/types';

import { BASE_API_URL, PATH_PODCASTS_BY_FEED_URL } from './constants';
import { getHeaders } from './getHeaders';
import type { PodcastIndexConfig } from './types';
import { request } from './utils/request';

export async function podcastsByFeedUrl(
  feedUrl: string,
  config: PodcastIndexConfig,
): Promise<ApiResponse.PodcastById> {
  const url = new URL(PATH_PODCASTS_BY_FEED_URL, BASE_API_URL);
  url.searchParams.set('url', feedUrl);

  const options = {
    headers: getHeaders(config),
    method: 'get',
  };

  return await request<ApiResponse.PodcastById>(url.toString(), options);
}

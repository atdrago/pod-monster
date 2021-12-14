import type { ApiResponse } from 'podcastdx-client/src/types';

import { http } from 'utils/http';

import { assertConfig, getConfig } from './config';
import { BASE_API_URL, PATH_PODCASTS_BY_FEED_URL } from './constants';
import { getHeaders } from './getHeaders';
import type { IPodcastIndexConfig } from './types';

export async function podcastsByFeedUrl(
  feedUrl: string,
  config: IPodcastIndexConfig | null = getConfig()
): Promise<ApiResponse.PodcastById> {
  assertConfig('podcastsByFeedId', config);

  const url = new URL(PATH_PODCASTS_BY_FEED_URL, BASE_API_URL);
  url.searchParams.set('url', feedUrl);

  const options = {
    headers: getHeaders(config),
    method: 'get',
  };

  return await http<ApiResponse.PodcastById>(url.toString(), options);
}

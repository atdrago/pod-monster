import type { ApiResponse } from 'podcastdx-client/src/types';

import { BASE_API_URL, PATH_SEARCH_BY_TERM } from './constants';
import { getHeaders } from './getHeaders';
import type { IPodcastIndexConfig } from './types';
import { request } from './utils/request';

export async function searchByTerm(
  term: string,
  config: IPodcastIndexConfig,
): Promise<ApiResponse.Search> {
  const url = new URL(PATH_SEARCH_BY_TERM, BASE_API_URL);
  url.searchParams.set('q', term);

  const options = {
    headers: getHeaders(config),
    method: 'get',
  };

  return await request<ApiResponse.Search>(url.toString(), options);
}

import type { ApiResponse } from 'podcastdx-client/src/types';

import { http } from 'utils/http';

import { assertConfig, getConfig } from './config';
import { BASE_API_URL, PATH_SEARCH_BY_TERM } from './constants';
import { getHeaders } from './getHeaders';
import type { IPodcastIndexConfig } from './types';

export async function searchByTerm(
  term: string,
  config: IPodcastIndexConfig | null = getConfig()
): Promise<ApiResponse.Search> {
  assertConfig('searchByTerm', config);

  const url = new URL(PATH_SEARCH_BY_TERM, BASE_API_URL);
  url.searchParams.set('q', term);

  const options = {
    headers: getHeaders(config),
    method: 'get',
  };

  return await http<ApiResponse.Search>(url.toString(), options);
}

import type { PIApiEpisodeDetail } from 'podcastdx-client/src/types';

import type { IChapter } from 'types';
import { request } from 'utils/request';

export const fetchPodcastEpisodeChapters = async (
  chaptersUrl?: PIApiEpisodeDetail['chaptersUrl'],
): Promise<Array<IChapter>> => {
  if (!chaptersUrl) {
    throw new Error('`chaptersUrl` is required');
  }

  const chaptersProxyUrl = new URL(
    '/api/podcasts/chapters',
    process.env.NEXT_PUBLIC_BASE_URL,
  );

  chaptersProxyUrl.searchParams.set('url', chaptersUrl);

  return await request<Array<IChapter>>(chaptersProxyUrl.toString(), {
    method: 'GET',
  });
};

import type { Chapter } from 'types';
import { request } from 'utils/request';

export const fetchPodcastEpisodeChapters = async (
  chaptersUrl: string,
): Promise<Array<Chapter>> => {
  const chaptersProxyUrl = new URL(
    '/api/podcasts/chapters',
    process.env.NEXT_PUBLIC_BASE_URL,
  );

  chaptersProxyUrl.searchParams.set('url', chaptersUrl);

  return await request<Array<Chapter>>(chaptersProxyUrl.toString(), {
    method: 'GET',
  });
};

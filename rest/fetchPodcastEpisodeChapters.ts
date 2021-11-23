import type { PIApiEpisodeDetail } from 'podcastdx-client/src/types';

import type { IChapter } from 'types';

export const fetchPodcastEpisodeChapters = async (
  chaptersUrl?: PIApiEpisodeDetail['chaptersUrl']
): Promise<Array<IChapter> | null> => {
  if (!chaptersUrl) {
    return null;
  }

  try {
    const chaptersProxyUrl = new URL(
      '/api/podcasts/chapters',
      process.env.NEXT_PUBLIC_BASE_URL
    );

    chaptersProxyUrl.searchParams.set('url', chaptersUrl);

    const chaptersResponse = await fetch(chaptersProxyUrl.toString(), {
      method: 'GET',
    });

    if (!chaptersResponse.ok) {
      throw new Error('no k');
    }

    return await chaptersResponse.json();
  } catch (err) {
    // TODO: Capture exception

    return null;
  }
};

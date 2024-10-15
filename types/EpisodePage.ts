import type { GetStaticProps } from 'next';
import type { ApiResponse, PIApiPodcast } from 'podcastdx-client/src/types';

import type { ImageDimensions } from 'types';

export type EpisodePageEpisode = ApiResponse.EpisodeById['episode'] & {
  descriptionRaw?: string;
};

/**
 * All props must be optional because the episode page is using `fallback: true`
 */
export interface EpisodePageProps {
  episode?: EpisodePageEpisode;
  episodeImageDimensions?: ImageDimensions;
  feedFunding?: PIApiPodcast['funding'] | null;
  feedLink?: string;
  feedType?: 'rss' | 'atom';
  feedUrl?: string;
}

export type EpisodePageGetStaticProps = GetStaticProps<EpisodePageProps>;

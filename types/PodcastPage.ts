import type { GetStaticProps } from 'next';
import type { ApiResponse } from 'podcastdx-client/src/types';

export interface PodcastPageProps {
  episodes: ApiResponse.EpisodesByFeedId['items'];
  feed: ApiResponse.PodcastById['feed'];
}

export type PodcastPageGetStaticProps = GetStaticProps<PodcastPageProps>;

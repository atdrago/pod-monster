import type { GetStaticProps } from 'next';
import type { ApiResponse } from 'podcastdx-client/src/types';

export type EpisodePageEpisode = ApiResponse.EpisodeById['episode'] & {
  descriptionRaw?: string;
};

/**
 * All props must be optional because the episode page is using `fallback: true`
 */
export interface IEpisodePageProps {
  episode?: EpisodePageEpisode;
  feedLink: string;
  feedType: 'rss' | 'atom';
  feedUrl: string;
}

export type EpisodePageGetStaticProps = GetStaticProps<IEpisodePageProps>;

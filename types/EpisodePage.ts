import type { GetStaticProps } from 'next';
import type { ApiResponse } from 'podcastdx-client/src/types';

/**
 * All props must be optional because the episode page is using `fallback: true`
 */
export interface IEpisodePageProps {
  episode?: ApiResponse.EpisodeById['episode'];
}

export type EpisodePageGetStaticProps = GetStaticProps<IEpisodePageProps>;

import type { GetStaticProps } from 'next';
import type { ApiResponse } from 'podcastdx-client/src/types';

export interface IEpisodePageProps {
  episode: ApiResponse.EpisodeById['episode'];
}

export type EpisodePageGetStaticProps = GetStaticProps<IEpisodePageProps>;

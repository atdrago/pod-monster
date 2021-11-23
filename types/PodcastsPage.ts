import type { GetServerSideProps } from 'next';
import type { ApiResponse } from 'podcastdx-client/src/types';

export interface IPodcastsPageProps {
  initialSearchResponse: ApiResponse.Search | null;
  podcastIndexAuthTime: string;
  podcastIndexAuthToken: string;
}

export type PodcastsPageGetServerSideProps = GetServerSideProps<
  IPodcastsPageProps,
  { term: string }
>;

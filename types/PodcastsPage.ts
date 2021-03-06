import type { GetServerSideProps } from 'next';
import { dehydrate } from 'react-query';

export interface IPodcastsPageProps {
  dehydratedState: ReturnType<typeof dehydrate>;
  initialSearchTerm: string | null;
  podcastIndexAuthTime: number;
  podcastIndexAuthToken: string;
}

export type PodcastsPageGetServerSideProps = GetServerSideProps<
  IPodcastsPageProps,
  { term: string }
>;

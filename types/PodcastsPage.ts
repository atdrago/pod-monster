import { dehydrate } from '@tanstack/react-query';
import type { GetServerSideProps } from 'next';

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

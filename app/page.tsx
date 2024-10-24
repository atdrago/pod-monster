import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { getAuthValues, searchByTerm } from '@atdrago/podcast-index';
import { createMetadata } from 'utils/createMetadata';
import { getPodcastIndexConfig } from 'utils/getPodcastIndexConfig';
import { getQueryClient } from 'utils/getQueryClient';

import { HomePage } from './HomePage';

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata({
    description: 'Search for and subscribe to podcasts',
    titles: ['Home'],
  });
}

/**
 * @see .next/types/app/page
 */
interface PageProps {
  params?: Promise<unknown>;
  searchParams?: Promise<{ term?: string }>;
}

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  const [authTime, authToken] = getAuthValues(
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_KEY,
    process.env.NEXT_PUBLIC_PODCAST_INDEX_API_SECRET,
  );
  const queryClient = getQueryClient();

  const searchTerm =
    typeof searchParams?.term === 'string' ? searchParams.term : null;

  if (searchTerm) {
    queryClient.prefetchQuery({
      queryFn: async () =>
        await searchByTerm(
          searchTerm,
          getPodcastIndexConfig(authTime, authToken),
        ),
      queryKey: ['searchByTerm', searchTerm],
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage
        podcastIndexAuthTime={authTime}
        podcastIndexAuthToken={authToken}
      />
    </HydrationBoundary>
  );
}

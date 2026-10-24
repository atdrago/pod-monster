import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { searchByTerm } from '@atdrago/podcast-index';
import { getPodcastPath } from 'utils/paths';

import { HomePage } from './HomePage';

const { searchParams } = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => searchParams,
}));
vi.mock('@atdrago/podcast-index', () => ({ searchByTerm: vi.fn() }));

const SEARCH_FEED_URL = 'https://example.com/search.xml';

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage podcastIndexAuthTime={0} podcastIndexAuthToken="token" />
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    searchParams.set('term', 'example');
    vi.mocked(searchByTerm).mockResolvedValue({
      count: 1,
      description: 'Found matching feeds',
      feeds: [
        {
          author: 'Search Author',
          dead: 0,
          id: 920666,
          image: 'https://example.com/search.jpg',
          title: 'Search Show',
          url: SEARCH_FEED_URL,
        },
      ],
      status: 'true',
    } as unknown as Awaited<ReturnType<typeof searchByTerm>>);
  });

  afterEach(() => {
    searchParams.delete('term');
    vi.mocked(searchByTerm).mockReset();
  });

  it('should link each search result to the show path of its feed URL', async () => {
    renderHomePage();

    expect(
      await screen.findByRole('link', { name: /Search Show/ }),
    ).toHaveAttribute('href', getPodcastPath({ feedUrl: SEARCH_FEED_URL }));
  });

  it('should show no Subscribe or Unsubscribe button in a search result', async () => {
    renderHomePage();

    await screen.findByRole('link', { name: /Search Show/ });

    expect(screen.queryByRole('button', { name: /subscribe/i })).toBeNull();
  });
});

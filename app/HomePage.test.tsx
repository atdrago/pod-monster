import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { searchByTerm } from '@atdrago/podcast-index';
import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import { fetchPodcastEpisodes } from 'rest/fetchPodcastEpisodes';
import { getPodcastPath } from 'utils/paths';

import { HomePage } from './HomePage';

const { searchParams } = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => searchParams,
}));
vi.mock('@atdrago/podcast-index', () => ({ searchByTerm: vi.fn() }));
vi.mock('rest/fetchPodcastEpisodes', () => ({
  fetchPodcastEpisodes: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const THIRTY_DAYS_AGO = -30 * 24 * 60 * 60;
const NEW_EPISODE_DATE = Date.parse('2026-10-10T12:00:00.000Z') / 1000;
const SUBSCRIBED_AT = '2026-10-01T00:00:00.000Z';
const SHOW_A_FEED_URL = 'https://example.com/a.xml';
const SHOW_B_FEED_URL = 'https://example.com/b.xml';
const MEMBER_FEED_URL =
  'https://www.patreon.com/rss/example?auth=Secret123&show=456';
const OLD_FEED_URL = 'https://example.com/old.xml';
const LIBRARY = {
  [MEMBER_FEED_URL]: { subscribedAt: SUBSCRIBED_AT, title: 'Member Show' },
  [OLD_FEED_URL]: {
    podcastIndexId: 333,
    subscribedAt: null,
    title: 'Old Show',
  },
  [SHOW_A_FEED_URL]: {
    podcastIndexId: 111,
    subscribedAt: SUBSCRIBED_AT,
    title: 'Show A',
  },
  [SHOW_B_FEED_URL]: {
    podcastIndexId: 222,
    subscribedAt: SUBSCRIBED_AT,
    title: 'Show B',
  },
};

type EpisodesResponse = Awaited<ReturnType<typeof fetchPodcastEpisodes>>;

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function answerEpisodes(
  items: Array<{
    enclosureUrl: string;
    feedId: number;
    guid: string;
  }>,
) {
  vi.mocked(fetchPodcastEpisodes).mockResolvedValue({
    count: items.length,
    items: items.map((item) => ({ ...item, datePublished: NEW_EPISODE_DATE })),
    status: 'true',
  } as unknown as EpisodesResponse);
}

async function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rendered = renderHook(() => useSettingsContext(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          {children}
          <HomePage podcastIndexAuthTime={0} podcastIndexAuthToken="token" />
        </SettingsProvider>
      </QueryClientProvider>
    ),
  });

  await waitFor(() =>
    expect(rendered.result.current.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

async function renderHomePageWithLibrary() {
  const rendered = await renderHomePage();

  await act(() => rendered.result.current.setAllFeedSettings(LIBRARY));

  return rendered;
}

function getNewEpisodesDot(title: string) {
  return within(
    screen.getByRole('link', { name: new RegExp(title) }),
  ).queryByRole('status', { name: 'New episodes.' });
}

describe('HomePage', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  afterEach(() => {
    searchParams.delete('term');
    vi.mocked(fetchPodcastEpisodes).mockReset();
    vi.mocked(searchByTerm).mockReset();
  });

  it('should send only the stored Podcast Index feed ids, and no feed URL, to the new episode refresh', async () => {
    answerEpisodes([]);

    await renderHomePageWithLibrary();

    await waitFor(() => expect(fetchPodcastEpisodes).toHaveBeenCalled());
    expect(vi.mocked(fetchPodcastEpisodes).mock.calls).toEqual([
      [[111, 222], THIRTY_DAYS_AGO],
    ]);

    const requestText = JSON.stringify(
      vi.mocked(fetchPodcastEpisodes).mock.calls,
    );

    expect(requestText).not.toContain('example.com');
    expect(requestText).not.toContain('patreon.com');
  });

  it('should send the sorted Podcast Index feed ids in a browser that has no Array.prototype.toSorted', async () => {
    const toSortedDescriptor = Object.getOwnPropertyDescriptor(
      Array.prototype,
      'toSorted',
    )!;

    answerEpisodes([]);
    Reflect.deleteProperty(Array.prototype, 'toSorted');

    try {
      const { result } = await renderHomePage();

      await act(() =>
        result.current.setAllFeedSettings({
          [SHOW_B_FEED_URL]: LIBRARY[SHOW_B_FEED_URL],
          // eslint-disable-next-line sort-keys-fix/sort-keys-fix -- The id 222 comes before the id 111, so the test checks the sort.
          [SHOW_A_FEED_URL]: LIBRARY[SHOW_A_FEED_URL],
        }),
      );

      await waitFor(() => expect(fetchPodcastEpisodes).toHaveBeenCalled());
      expect(vi.mocked(fetchPodcastEpisodes).mock.calls).toEqual([
        [[111, 222], THIRTY_DAYS_AGO],
      ]);
    } finally {
      Object.defineProperty(Array.prototype, 'toSorted', toSortedDescriptor);
    }
  });

  it('should list each subscribed show, with a link to its show path', async () => {
    answerEpisodes([]);

    await renderHomePageWithLibrary();

    expect(screen.getByRole('link', { name: /Member Show/ })).toHaveAttribute(
      'href',
      getPodcastPath({ feedUrl: MEMBER_FEED_URL }),
    );
    expect(screen.getByRole('link', { name: /Show A/ })).toHaveAttribute(
      'href',
      getPodcastPath({ feedUrl: SHOW_A_FEED_URL }),
    );
    expect(screen.queryByText('Old Show')).toBeNull();
  });

  it('should show the new episodes dot only on the show whose Podcast Index feed id matches the episode', async () => {
    answerEpisodes([
      {
        enclosureUrl: 'https://example.com/a-1.mp3',
        feedId: 111,
        guid: 'guid-a-1',
      },
    ]);

    await renderHomePageWithLibrary();

    await waitFor(() => expect(getNewEpisodesDot('Show A')).toBeVisible());
    expect(getNewEpisodesDot('Show B')).toBeNull();
    expect(getNewEpisodesDot('Member Show')).toBeNull();
  });

  it('should hide the new episodes dot when the episode identity has a saved position', async () => {
    answerEpisodes([
      {
        enclosureUrl: 'https://example.com/a-1.mp3',
        feedId: 111,
        guid: ' guid-a-1 ',
      },
      {
        enclosureUrl: 'https://example.com/b-1.mp3',
        feedId: 222,
        guid: '',
      },
    ]);

    const { result } = await renderHomePageWithLibrary();

    await waitFor(() => expect(getNewEpisodesDot('Show A')).toBeVisible());
    expect(getNewEpisodesDot('Show B')).toBeVisible();

    await act(() =>
      result.current.setEpisodeSettingsItem(
        { episodeIdentity: 'guid-a-1', feedUrl: SHOW_A_FEED_URL },
        { currentTime: 1 },
      ),
    );
    await act(() =>
      result.current.setEpisodeSettingsItem(
        {
          episodeIdentity: 'https://example.com/b-1.mp3',
          feedUrl: SHOW_B_FEED_URL,
        },
        { currentTime: 1 },
      ),
    );

    expect(getNewEpisodesDot('Show A')).toBeNull();
    expect(getNewEpisodesDot('Show B')).toBeNull();
  });

  it('should make no new episode refresh when no show in the library has a Podcast Index feed id', async () => {
    const { result } = await renderHomePage();

    await act(() =>
      result.current.setAllFeedSettings({
        [MEMBER_FEED_URL]: LIBRARY[MEMBER_FEED_URL],
      }),
    );

    expect(screen.getByRole('link', { name: /Member Show/ })).toBeVisible();
    expect(fetchPodcastEpisodes).not.toHaveBeenCalled();
  });

  it('should link each search result to the show path of its feed URL, and subscribe with its Podcast Index feed id', async () => {
    const searchFeedUrl = 'https://example.com/search.xml';

    answerEpisodes([]);
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
          link: 'https://example.com/search',
          title: 'Search Show',
          type: 0,
          url: searchFeedUrl,
        },
      ],
      status: 'true',
    } as unknown as Awaited<ReturnType<typeof searchByTerm>>);

    const { result } = await renderHomePage();
    const searchResultLink = await screen.findByRole('link', {
      name: /Search Show/,
    });

    expect(searchResultLink).toHaveAttribute(
      'href',
      getPodcastPath({ feedUrl: searchFeedUrl }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() =>
      expect(
        result.current.getFeedSettingsItem({ feedUrl: searchFeedUrl }),
      ).toEqual({
        htmlUrl: 'https://example.com/search',
        image: 'https://example.com/search.jpg',
        podcastIndexId: 920666,
        subscribedAt: expect.any(String),
        title: 'Search Show',
        type: 'rss',
      }),
    );
  });
});

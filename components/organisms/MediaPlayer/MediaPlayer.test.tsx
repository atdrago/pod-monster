import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import { MediaProvider, useMediaContext } from 'contexts/MediaContext';
import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import { decodeBase64UrlSegment, decodeFeedUrlSegment } from 'utils/base64Url';
import { getEpisodePath } from 'utils/paths';

import { MediaPlayer } from './MediaPlayer';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const FEED_URL = 'https://example.com/members/feed.xml?token=Secret123';
const EPISODE_IDENTITY = 'tag:example.com,2026:episode/1?part=a&lang=fr ü';
const EPISODE_TITLE = 'Episode 1';

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <SettingsProvider>
        <MediaProvider>
          {children}
          <MediaPlayer />
        </MediaProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

async function renderMediaPlayerWithEpisode(
  pathname: string,
  episodeIdentity = EPISODE_IDENTITY,
) {
  vi.mocked(usePathname).mockReturnValue(pathname);

  const rendered = renderHook(
    () => ({ media: useMediaContext(), settings: useSettingsContext() }),
    { wrapper: Providers },
  );

  await waitFor(() =>
    expect(rendered.result.current.settings.isDoneHydratingFromIdb).toBe(true),
  );

  act(() => {
    const { media } = rendered.result.current;

    media.setFeedUrl(FEED_URL);
    media.setEpisodeIdentity(episodeIdentity);
    media.setEpisodeTitle(EPISODE_TITLE);
    media.setSrc('data:audio/mpeg;base64,');
    media.setSize(2);
  });

  return rendered;
}

describe('MediaPlayer', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it('should give back the feed URL and the identity after the route decode of the episode path', () => {
    const [, feeds, feedSegment, episodes, episodeSegment] = getEpisodePath({
      episodeIdentity: EPISODE_IDENTITY,
      feedUrl: FEED_URL,
    }).split('/');

    expect([feeds, episodes]).toEqual(['feeds', 'episodes']);
    expect(decodeFeedUrlSegment(feedSegment)).toBe(FEED_URL);
    expect(decodeBase64UrlSegment(episodeSegment)).toBe(EPISODE_IDENTITY);
  });

  it('should mark the episode in the player as the episode of the page on its episode path', async () => {
    await renderMediaPlayerWithEpisode(
      getEpisodePath({ episodeIdentity: EPISODE_IDENTITY, feedUrl: FEED_URL }),
    );

    expect(await screen.findByText(EPISODE_TITLE)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: EPISODE_TITLE }),
    ).not.toBeInTheDocument();
  });

  it('should link to the episode in the player from another page', async () => {
    await renderMediaPlayerWithEpisode('/');

    expect(
      await screen.findByRole('link', { name: EPISODE_TITLE }),
    ).toHaveAttribute(
      'href',
      getEpisodePath({ episodeIdentity: EPISODE_IDENTITY, feedUrl: FEED_URL }),
    );
  });

  it('should link to the episode in the player from the page of an episode whose path starts with its path', async () => {
    const playerEpisodePath = getEpisodePath({
      episodeIdentity: 'abc',
      feedUrl: FEED_URL,
    });
    const pageEpisodePath = getEpisodePath({
      episodeIdentity: 'abcd',
      feedUrl: FEED_URL,
    });

    expect(pageEpisodePath.startsWith(playerEpisodePath)).toBe(true);

    await renderMediaPlayerWithEpisode(pageEpisodePath, 'abc');

    expect(
      await screen.findByRole('link', { name: EPISODE_TITLE }),
    ).toHaveAttribute('href', playerEpisodePath);
  });
});

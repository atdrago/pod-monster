import { act, renderHook, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import type { PodcastEpisode } from 'types/PodcastFeed';

import { EpisodeUnlistenedDot } from './EpisodeUnlistenedDot';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const FEED_URL = 'https://example.com/members/feed.xml?token=Secret123';
const GUID = 'tag:example.com,2026:"episode-1"';
const EPISODE: Pick<PodcastEpisode, 'datePublished' | 'feedUrl' | 'identity'> =
  {
    datePublished: Date.parse('2026-10-10T12:00:00.000Z') / 1000,
    feedUrl: FEED_URL,
    identity: GUID,
  };
const FEED_SETTINGS_ITEM = {
  subscribedAt: '2026-10-01T00:00:00.000Z',
  title: 'Example Show',
};

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function renderEpisodeUnlistenedDot(
  episode: Parameters<typeof EpisodeUnlistenedDot>[0]['episode'] = EPISODE,
) {
  const rendered = renderHook(() => useSettingsContext(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <SettingsProvider>
        {children}
        <EpisodeUnlistenedDot episode={episode} />
      </SettingsProvider>
    ),
  });

  await waitFor(() =>
    expect(rendered.result.current.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

describe('EpisodeUnlistenedDot', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it('should render the dot for a new episode of a show in the library', async () => {
    const { result } = await renderEpisodeUnlistenedDot();

    await act(() =>
      result.current.setFeedSettingsItem(
        { feedUrl: FEED_URL },
        FEED_SETTINGS_ITEM,
      ),
    );

    expect(screen.getByLabelText('New episodes')).toBeVisible();
  });

  it('should hide the dot when the context saves a position for the same feed URL and guid', async () => {
    const { result } = await renderEpisodeUnlistenedDot();

    await act(() =>
      result.current.setFeedSettingsItem(
        { feedUrl: FEED_URL },
        FEED_SETTINGS_ITEM,
      ),
    );
    await act(() =>
      result.current.setEpisodeSettingsItem(
        { episodeIdentity: 'episode-2', feedUrl: FEED_URL },
        { currentTime: 1 },
      ),
    );

    expect(screen.getByLabelText('New episodes')).toBeVisible();

    await act(() =>
      result.current.setEpisodeSettingsItem(
        { episodeIdentity: GUID, feedUrl: FEED_URL },
        { currentTime: 1 },
      ),
    );

    expect(screen.queryByLabelText('New episodes')).toBeNull();
  });

  it('should not render the dot for a show that is not in the library', async () => {
    await renderEpisodeUnlistenedDot();

    expect(screen.queryByLabelText('New episodes')).toBeNull();
  });

  it('should not render the dot for an episode from before the subscription', async () => {
    const { result } = await renderEpisodeUnlistenedDot({
      ...EPISODE,
      datePublished: Date.parse('2026-09-01T00:00:00.000Z') / 1000,
    });

    await act(() =>
      result.current.setFeedSettingsItem(
        { feedUrl: FEED_URL },
        FEED_SETTINGS_ITEM,
      ),
    );

    expect(screen.queryByLabelText('New episodes')).toBeNull();
  });

  it('should not render the dot for an episode with no publish date', async () => {
    const { result } = await renderEpisodeUnlistenedDot({
      ...EPISODE,
      datePublished: undefined,
    });

    await act(() =>
      result.current.setFeedSettingsItem(
        { feedUrl: FEED_URL },
        FEED_SETTINGS_ITEM,
      ),
    );

    expect(screen.queryByLabelText('New episodes')).toBeNull();
  });
});

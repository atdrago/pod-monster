import { act, renderHook, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import type { PodcastEpisode } from 'types/PodcastFeed';
import { longDateTimeFormat } from 'utils/date';

import { EpisodeProgress } from './EpisodeProgress';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const FEED_URL = 'https://example.com/members/feed.xml?token=Secret123';
const GUID = 'tag:example.com,2026:"episode-1"';
const EPISODE: Pick<
  PodcastEpisode,
  'datePublished' | 'duration' | 'feedUrl' | 'identity'
> = {
  datePublished: Date.parse('2026-10-10T12:00:00.000Z') / 1000,
  duration: 3600,
  feedUrl: FEED_URL,
  identity: GUID,
};

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function renderEpisodeProgress(
  episode: Parameters<typeof EpisodeProgress>[0]['episode'] = EPISODE,
) {
  const rendered = renderHook(() => useSettingsContext(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <SettingsProvider>
        {children}
        <EpisodeProgress episode={episode} />
      </SettingsProvider>
    ),
  });

  await waitFor(() =>
    expect(rendered.result.current.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

describe('EpisodeProgress', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it('should render the date and the length of an episode with no saved position', async () => {
    await renderEpisodeProgress();

    expect(
      screen.getByText(
        longDateTimeFormat.format(new Date('2026-10-10T12:00:00.000Z')),
      ),
    ).toBeVisible();
    expect(screen.getByText('00:00:00')).toBeVisible();
    expect(screen.getByText('01:00:00')).toBeVisible();
  });

  it('should read back the position that the context saves for the same feed URL and guid', async () => {
    const { result } = await renderEpisodeProgress();

    await act(() =>
      result.current.setEpisodeSettingsItem(
        { episodeIdentity: GUID, feedUrl: FEED_URL },
        { currentTime: 600, duration: 3600 },
      ),
    );

    expect(screen.getByText('00:10:00')).toBeVisible();
    expect(screen.getByText('00:50:00')).toBeVisible();
  });

  it('should not read the position of another guid or another feed URL', async () => {
    const { result } = await renderEpisodeProgress();

    await act(() =>
      result.current.setEpisodeSettingsItem(
        { episodeIdentity: 'episode-2', feedUrl: FEED_URL },
        { currentTime: 600, duration: 3600 },
      ),
    );
    await act(() =>
      result.current.setEpisodeSettingsItem(
        { episodeIdentity: GUID, feedUrl: 'https://example.com/other.xml' },
        { currentTime: 600, duration: 3600 },
      ),
    );

    expect(screen.getByText('00:00:00')).toBeVisible();
    expect(screen.queryByText('00:10:00')).toBeNull();
  });

  it('should render no date for an episode with no publish date', async () => {
    await renderEpisodeProgress({ ...EPISODE, datePublished: undefined });

    expect(screen.queryByText(/2026/)).toBeNull();
    expect(screen.getByText('01:00:00')).toBeVisible();
  });
});

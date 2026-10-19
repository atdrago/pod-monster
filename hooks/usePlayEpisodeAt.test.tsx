import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';

import { MediaProvider, useMediaContext } from 'contexts/MediaContext';
import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import type { PodcastEpisode } from 'types/PodcastFeed';

import { usePlayEpisodeAt } from './usePlayEpisodeAt';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const EPISODE: PodcastEpisode = {
  chaptersUrl: 'https://example.com/chapters.json',
  enclosureType: 'audio/mpeg',
  enclosureUrl: 'https://example.com/episode-1.mp3',
  feedImage: 'https://example.com/feed.jpg',
  feedTitle: 'Example Show',
  feedUrl: 'https://example.com/feed.xml',
  identity: 'episode-1',
  title: 'Episode 1',
};
const EPISODE_REFERENCE = {
  episodeIdentity: EPISODE.identity,
  feedUrl: EPISODE.feedUrl,
};

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
        <MediaProvider>{children}</MediaProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

/** Saves a position for the episode, and can put the episode in the player. */
async function seedSettings({
  currentTime,
  isInThePlayer = false,
}: {
  currentTime: number;
  isInThePlayer?: boolean;
}) {
  const { result, unmount } = renderHook(() => useSettingsContext(), {
    wrapper: SettingsProvider,
  });

  await waitFor(() => expect(result.current.isDoneHydratingFromIdb).toBe(true));
  await act(() =>
    result.current.setEpisodeSettingsItem(EPISODE_REFERENCE, {
      currentTime,
      duration: 3600,
    }),
  );

  if (isInThePlayer) {
    await act(() =>
      result.current.setMediaPlayerSettings({
        chaptersUrl: null,
        episodeIdentity: EPISODE.identity,
        episodeImage: null,
        episodeImageDimensions: null,
        episodeTitle: EPISODE.title,
        feedImage: null,
        feedTitle: EPISODE.feedTitle,
        feedUrl: EPISODE.feedUrl,
        isMuted: false,
        isPaused: true,
        isTranscriptVisibleAsSubtitle: true,
        playbackRate: 1,
        size: 1,
        src: EPISODE.enclosureUrl ?? null,
        srcType: 'audio/mpeg',
        volume: 1,
      }),
    );
  }

  unmount();
}

function renderPlayEpisodeAt(episode: PodcastEpisode = EPISODE) {
  return renderHook(
    () => ({
      media: useMediaContext(),
      playEpisodeAt: usePlayEpisodeAt({ episode }),
      settings: useSettingsContext(),
    }),
    { wrapper: Providers },
  );
}

async function renderHydratedPlayEpisodeAt(episode: PodcastEpisode = EPISODE) {
  const rendered = renderPlayEpisodeAt(episode);

  await waitFor(() =>
    expect(rendered.result.current.settings.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

function attachAudioElement(
  media: ReturnType<typeof useMediaContext>,
  currentTime: number,
) {
  const audioElement = document.createElement('audio');

  audioElement.currentTime = currentTime;
  vi.spyOn(audioElement, 'play').mockResolvedValue(undefined);
  media.audioRef.current = audioElement;

  return audioElement;
}

describe('usePlayEpisodeAt', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  it('should load an episode that is not in the player at an explicit time, and play it', async () => {
    await seedSettings({ currentTime: 2412 });

    const { result } = await renderHydratedPlayEpisodeAt();

    await act(() => result.current.playEpisodeAt(754));

    expect(result.current.media.episodeIdentity).toBe(EPISODE.identity);
    expect(result.current.media.feedUrl).toBe(EPISODE.feedUrl);
    expect(result.current.media.src).toBe(EPISODE.enclosureUrl);
    expect(result.current.media.chaptersUrl).toBe(EPISODE.chaptersUrl);
    expect(result.current.media.currentTime).toBe(754);
    expect(result.current.media.isPaused).toBe(false);
  });

  it('should read the saved position at call time when hydration ends after mount', async () => {
    await seedSettings({ currentTime: 2412 });

    const { result } = renderPlayEpisodeAt();

    expect(result.current.settings.isDoneHydratingFromIdb).toBe(false);
    expect(
      result.current.settings.getEpisodeSettingsItem(EPISODE_REFERENCE),
    ).toBeUndefined();

    await waitFor(() =>
      expect(result.current.settings.isDoneHydratingFromIdb).toBe(true),
    );
    await act(() => result.current.playEpisodeAt());

    expect(result.current.media.episodeIdentity).toBe(EPISODE.identity);
    expect(result.current.media.currentTime).toBe(2412);
    expect(result.current.media.isPaused).toBe(false);
  });

  it('should start an episode with no saved position at 0', async () => {
    const { result } = await renderHydratedPlayEpisodeAt();

    await act(() => result.current.playEpisodeAt());

    expect(result.current.media.episodeIdentity).toBe(EPISODE.identity);
    expect(result.current.media.currentTime).toBe(0);
  });

  it('should seek and play an episode that is already loaded and paused', async () => {
    await seedSettings({ currentTime: 300, isInThePlayer: true });

    const { result } = await renderHydratedPlayEpisodeAt();

    expect(result.current.media.currentTime).toBe(300);

    const audioElement = attachAudioElement(result.current.media, 300);

    await act(() => result.current.playEpisodeAt(90));

    expect(result.current.media.currentTime).toBe(90);
    expect(result.current.media.mediaPlayerCurrentTime).toBe(90);
    expect(audioElement.currentTime).toBe(90);
    expect(audioElement.play).toHaveBeenCalledOnce();
    expect(result.current.media.isPaused).toBe(false);
  });

  it('should seek to the same time again after playback moves on', async () => {
    await seedSettings({ currentTime: 300, isInThePlayer: true });

    const { result } = await renderHydratedPlayEpisodeAt();
    const audioElement = attachAudioElement(result.current.media, 300);

    await act(() => result.current.playEpisodeAt(90));

    audioElement.currentTime = 120;
    act(() => result.current.media.setMediaPlayerCurrentTime(120));

    await act(() => result.current.playEpisodeAt(90));

    expect(audioElement.currentTime).toBe(90);
    expect(result.current.media.mediaPlayerCurrentTime).toBe(90);
    expect(audioElement.play).toHaveBeenCalledTimes(2);
  });

  it('should resume an episode that is already loaded, with no seek, when no time is given', async () => {
    await seedSettings({ currentTime: 300, isInThePlayer: true });

    const { result } = await renderHydratedPlayEpisodeAt();
    const audioElement = attachAudioElement(result.current.media, 310);

    await act(() => result.current.playEpisodeAt());

    expect(audioElement.currentTime).toBe(310);
    expect(audioElement.play).toHaveBeenCalledOnce();
    expect(result.current.media.isPaused).toBe(false);
  });

  it('should do nothing for an episode with no enclosure URL', async () => {
    const { result } = await renderHydratedPlayEpisodeAt({
      ...EPISODE,
      enclosureUrl: undefined,
    });

    await act(() => result.current.playEpisodeAt(90));

    expect(result.current.media.episodeIdentity).toBeNull();
    expect(result.current.media.src).toBeNull();
    expect(result.current.media.isPaused).toBe(true);
  });
});

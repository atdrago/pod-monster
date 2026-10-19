import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { openDB } from 'idb';
import type { PropsWithChildren } from 'react';

import { SettingsProvider, useSettingsContext } from 'contexts/SettingsContext';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';

import { MediaProvider, useMediaContext } from './MediaContext';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('rest/fetchPodcastEpisodeChapters', () => ({
  fetchPodcastEpisodeChapters: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const FEED_URL = 'https://example.com/feed.xml';
const VERSION_5_MEDIA_PLAYER_SETTINGS = {
  chaptersUrl: null,
  currentTime: 120,
  dateCrawled: 1760000000,
  episodeId: 1234,
  episodeImage: null,
  episodeImageDimensions: null,
  episodeTitle: 'Episode 1',
  feedId: 920666,
  feedImage: null,
  feedTitle: 'Example Show',
  isMuted: false,
  isPaused: true,
  isTranscriptVisibleAsSubtitle: true,
  playbackRate: 1,
  size: 1,
  src: 'https://example.com/episode-1.mp3',
  srcType: 'audio/mpeg',
  volume: 1,
};

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function createDatabaseWithVersion5PlayerRecord(version: 5 | 6) {
  const database = await openDB(DATABASE_NAME, version, {
    upgrade(upgradeDatabase) {
      upgradeDatabase.createObjectStore('episodeSettings');
      upgradeDatabase.createObjectStore('feedSettings');
      upgradeDatabase.createObjectStore('mediaPlayerSettings');
    },
  });

  await database.put(
    'mediaPlayerSettings',
    VERSION_5_MEDIA_PLAYER_SETTINGS,
    'mediaPlayerSettings',
  );
  await database.put('episodeSettings', { currentTime: 120 }, '1234');
  database.close();
}

async function readEpisodeSettingsKeys() {
  const database = await openDB(DATABASE_NAME);
  const keys = await database.getAllKeys('episodeSettings');

  database.close();

  return keys.map(String);
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

async function renderHydratedContexts() {
  const rendered = renderHook(
    () => ({ media: useMediaContext(), settings: useSettingsContext() }),
    { wrapper: Providers },
  );

  await waitFor(() =>
    expect(rendered.result.current.settings.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

function waitForDebounce() {
  return act(() => new Promise((resolve) => setTimeout(resolve, 700)));
}

describe('MediaContext', () => {
  beforeEach(async () => {
    await deleteDatabase();
  });

  describe('hydration', () => {
    it('should hydrate the episode and its saved position after a new render', async () => {
      const firstRender = await renderHydratedContexts();

      act(() => {
        firstRender.result.current.media.setFeedUrl(FEED_URL);
        firstRender.result.current.media.setEpisodeIdentity('episode-1');
        firstRender.result.current.media.setEpisodeTitle('Episode 1');
        firstRender.result.current.media.setSrc(
          'https://example.com/episode-1.mp3',
        );
      });
      act(() => {
        firstRender.result.current.media.setMediaPlayerCurrentTime(120);
      });
      await waitForDebounce();
      firstRender.unmount();

      const { result } = await renderHydratedContexts();

      expect(result.current.media.feedUrl).toBe(FEED_URL);
      expect(result.current.media.episodeIdentity).toBe('episode-1');
      expect(result.current.media.episodeTitle).toBe('Episode 1');
      expect(result.current.media.src).toBe(
        'https://example.com/episode-1.mp3',
      );
      expect(result.current.media.currentTime).toBe(120);
      expect(result.current.media.mediaPlayerCurrentTime).toBe(120);
    });

    it('should hydrate no episode from a version 5 database with a player record', async () => {
      await createDatabaseWithVersion5PlayerRecord(5);

      const { result } = await renderHydratedContexts();

      expect(result.current.media.feedUrl).toBeNull();
      expect(result.current.media.episodeIdentity).toBeNull();
      expect(result.current.media.src).toBeNull();
    });

    it('should hydrate no episode and write no position from a player record with numeric ids', async () => {
      await createDatabaseWithVersion5PlayerRecord(6);

      const { result } = await renderHydratedContexts();

      expect(result.current.media.feedUrl).toBeNull();
      expect(result.current.media.episodeIdentity).toBeNull();

      act(() => {
        result.current.media.setMediaPlayerCurrentTime(50);
      });
      await waitForDebounce();

      const keys = await readEpisodeSettingsKeys();

      expect(keys).toEqual(['1234']);
      expect(
        keys.some((key) => key.includes('undefined') || key.includes('null')),
      ).toBe(false);
    });
  });

  describe('position writes', () => {
    it('should write the position of the episode in the player after the debounce', async () => {
      const { result } = await renderHydratedContexts();

      act(() => {
        result.current.media.setFeedUrl(FEED_URL);
        result.current.media.setEpisodeIdentity('episode-a');
      });
      act(() => {
        result.current.media.setMediaPlayerCurrentTime(42);
      });
      await waitForDebounce();

      expect(
        result.current.settings.getEpisodeSettingsItem({
          episodeIdentity: 'episode-a',
          feedUrl: FEED_URL,
        })?.currentTime,
      ).toBe(42);
    });

    it('should not save the time of episode A under episode B after a switch inside the debounce window', async () => {
      const { result } = await renderHydratedContexts();

      act(() => {
        result.current.media.setFeedUrl(FEED_URL);
        result.current.media.setEpisodeIdentity('episode-a');
      });
      act(() => {
        result.current.media.setMediaPlayerCurrentTime(100);
      });
      act(() => {
        result.current.media.setEpisodeIdentity('episode-b');
      });
      await waitForDebounce();

      expect(
        result.current.settings.getEpisodeSettingsItem({
          episodeIdentity: 'episode-b',
          feedUrl: FEED_URL,
        }),
      ).toBeUndefined();
      expect(
        result.current.settings.getEpisodeSettingsItem({
          episodeIdentity: 'episode-a',
          feedUrl: FEED_URL,
        })?.currentTime,
      ).toBe(100);

      act(() => {
        result.current.media.setCurrentTime(30);
      });
      await waitForDebounce();

      expect(
        result.current.settings.getEpisodeSettingsItem({
          episodeIdentity: 'episode-b',
          feedUrl: FEED_URL,
        })?.currentTime,
      ).toBe(30);
      expect(
        result.current.settings.getEpisodeSettingsItem({
          episodeIdentity: 'episode-a',
          feedUrl: FEED_URL,
        })?.currentTime,
      ).toBe(100);
    });

    it('should write no position when no episode is in the player', async () => {
      const { result } = await renderHydratedContexts();

      act(() => {
        result.current.media.setMediaPlayerCurrentTime(50);
      });
      await waitForDebounce();

      expect(await readEpisodeSettingsKeys()).toEqual([]);
    });
  });

  describe('chapters', () => {
    it('should load the chapters of an episode with a chapters URL and no `dateCrawled`', async () => {
      vi.mocked(fetchPodcastEpisodeChapters).mockResolvedValue([
        { startTime: 0, title: 'Introduction' },
      ]);

      const { result } = await renderHydratedContexts();

      act(() => {
        result.current.media.setChaptersUrl(
          'https://example.com/chapters.json',
        );
      });

      await waitFor(() =>
        expect(result.current.media.chapters).toEqual([
          { startTime: 0, title: 'Introduction' },
        ]),
      );
      expect(fetchPodcastEpisodeChapters).toHaveBeenCalledWith(
        'https://example.com/chapters.json',
      );
    });
  });
});

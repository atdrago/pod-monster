import { captureMessage } from '@sentry/nextjs';
import { act, renderHook, waitFor } from '@testing-library/react';
import { openDB } from 'idb';
import { StrictMode } from 'react';
import type { PropsWithChildren } from 'react';

import { SettingsProvider, useSettingsContext } from './SettingsContext';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

const DATABASE_NAME = 'pod.monster';
const OLD_STORE_NAMES = [
  'episodeSettings',
  'feedSettings',
  'mediaPlayerSettings',
];
const UPGRADED_STORE_NAMES = ['episodeSettings', 'mediaPlayerSettings'];
const FEED_URL = 'https://example.com/feed.xml';
const EPISODE_REFERENCE = { episodeIdentity: 'episode-1', feedUrl: FEED_URL };
// A version 6 build writes this key, so the version 7 code must read it.
const VERSION_6_EPISODE_KEY = JSON.stringify([FEED_URL, 'episode-1']);
const EPISODE_SETTINGS_ITEM = { currentTime: 120, duration: 3600 };
const FEED_SETTINGS_ITEM = {
  image: 'https://example.com/image.jpg',
  podcastIndexId: 920666,
  subscribedAt: '2026-10-18T00:00:00.000Z',
  title: 'Example Show',
};
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
const MEDIA_PLAYER_SETTINGS = {
  chaptersUrl: null,
  dateCrawled: null,
  episodeIdentity: 'episode-1',
  episodeImage: null,
  episodeImageDimensions: null,
  episodeTitle: 'Episode 1',
  feedImage: null,
  feedTitle: 'Example Show',
  feedUrl: FEED_URL,
  isMuted: false,
  isPaused: true,
  isTranscriptVisibleAsSubtitle: true,
  playbackRate: 1 as const,
  size: 1 as const,
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

async function createVersion5Database({
  blocking,
  storeNames = OLD_STORE_NAMES,
}: { blocking?: () => void; storeNames?: Array<string> } = {}) {
  const database = await openDB(DATABASE_NAME, 5, {
    blocking,
    upgrade(upgradeDatabase) {
      storeNames.forEach((storeName) => {
        upgradeDatabase.createObjectStore(storeName);
      });
    },
  });

  if (storeNames.includes('feedSettings')) {
    await database.put(
      'feedSettings',
      { ...FEED_SETTINGS_ITEM, xmlUrl: FEED_URL },
      '920666',
    );
  }

  if (storeNames.includes('episodeSettings')) {
    await database.put(
      'episodeSettings',
      { currentTime: 120, duration: 3600 },
      '1234',
    );
  }

  if (storeNames.includes('mediaPlayerSettings')) {
    await database.put(
      'mediaPlayerSettings',
      VERSION_5_MEDIA_PLAYER_SETTINGS,
      'mediaPlayerSettings',
    );
  }

  return database;
}

async function createVersion6Database({
  blocking,
}: { blocking?: () => void } = {}) {
  const database = await openDB(DATABASE_NAME, 6, {
    blocking,
    upgrade(upgradeDatabase) {
      OLD_STORE_NAMES.forEach((storeName) => {
        upgradeDatabase.createObjectStore(storeName);
      });
    },
  });

  await database.put('feedSettings', FEED_SETTINGS_ITEM, FEED_URL);
  await database.put(
    'episodeSettings',
    EPISODE_SETTINGS_ITEM,
    VERSION_6_EPISODE_KEY,
  );
  await database.put(
    'mediaPlayerSettings',
    MEDIA_PLAYER_SETTINGS,
    'mediaPlayerSettings',
  );

  return database;
}

async function readDatabase() {
  const database = await openDB(DATABASE_NAME);
  const storeNames = Array.from(database.objectStoreNames).sort();
  const counts = await Promise.all(
    storeNames.map((storeName) => database.count(storeName)),
  );
  const { version } = database;

  database.close();

  return { counts, storeNames, version };
}

function renderSettingsContext() {
  return renderHook(() => useSettingsContext(), { wrapper: SettingsProvider });
}

async function renderHydratedSettingsContext() {
  const rendered = renderSettingsContext();

  await waitFor(() =>
    expect(rendered.result.current.isDoneHydratingFromIdb).toBe(true),
  );

  return rendered;
}

describe('SettingsContext', () => {
  beforeEach(async () => {
    vi.mocked(captureMessage).mockClear();
    window.localStorage.removeItem('pod2.settings');
    await deleteDatabase();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('upgrade', () => {
    it('should open a version 6 database at version 7 with its saved position and player state, and without its feed store', async () => {
      (await createVersion6Database()).close();

      const { result } = await renderHydratedSettingsContext();

      expect(result.current.getEpisodeSettingsItem(EPISODE_REFERENCE)).toEqual(
        EPISODE_SETTINGS_ITEM,
      );
      expect(result.current.hydratedMediaPlayerSettings).toEqual(
        MEDIA_PLAYER_SETTINGS,
      );
      expect(await readDatabase()).toEqual({
        counts: [1, 1],
        storeNames: UPGRADED_STORE_NAMES,
        version: 7,
      });
      expect(captureMessage).not.toHaveBeenCalled();
    });

    it('should open a version 5 database with data at version 7 with two empty stores', async () => {
      (await createVersion5Database()).close();

      const { result } = await renderHydratedSettingsContext();

      expect(
        result.current.getEpisodeSettingsItem({
          episodeIdentity: '1234',
          feedUrl: FEED_URL,
        }),
      ).toBeUndefined();
      expect(result.current.hydratedMediaPlayerSettings).toBeUndefined();
      expect(await readDatabase()).toEqual({
        counts: [0, 0],
        storeNames: UPGRADED_STORE_NAMES,
        version: 7,
      });

      await act(() =>
        result.current.setEpisodeSettingsItem(
          EPISODE_REFERENCE,
          EPISODE_SETTINGS_ITEM,
        ),
      );

      expect(result.current.getEpisodeSettingsItem(EPISODE_REFERENCE)).toEqual(
        EPISODE_SETTINGS_ITEM,
      );
      expect((await readDatabase()).counts).toEqual([1, 0]);
    });

    it('should open a new database at version 7 with two stores', async () => {
      await renderHydratedSettingsContext();

      expect(await readDatabase()).toEqual({
        counts: [0, 0],
        storeNames: UPGRADED_STORE_NAMES,
        version: 7,
      });
      expect(captureMessage).not.toHaveBeenCalled();
    });

    it('should create the missing store of a version 5 database', async () => {
      (
        await createVersion5Database({
          storeNames: ['episodeSettings', 'feedSettings'],
        })
      ).close();

      await renderHydratedSettingsContext();

      expect(await readDatabase()).toEqual({
        counts: [0, 0],
        storeNames: UPGRADED_STORE_NAMES,
        version: 7,
      });
    });

    it('should remove the old localStorage key', async () => {
      window.localStorage.setItem(
        'pod2.settings',
        JSON.stringify({ _version: 0, feedSettings: {} }),
      );
      (await createVersion5Database()).close();

      await renderHydratedSettingsContext();

      expect(window.localStorage.getItem('pod2.settings')).toBeNull();
    });

    it('should finish the upgrade and keep the saved position when a version 6 connection closes on versionchange', async () => {
      const oldConnection = await createVersion6Database({
        blocking: () => oldConnection.close(),
      });

      const { result } = await renderHydratedSettingsContext();

      expect(result.current.getEpisodeSettingsItem(EPISODE_REFERENCE)).toEqual(
        EPISODE_SETTINGS_ITEM,
      );
      expect((await readDatabase()).version).toBe(7);
      expect(captureMessage).not.toHaveBeenCalled();
    });
  });

  describe('a blocked open', () => {
    it('should wait for an old tab to close, then hydrate with no reload', async () => {
      const oldConnection = await createVersion5Database();
      let isOldConnectionOpen = true;

      try {
        const { result } = renderSettingsContext();

        await waitFor(() =>
          expect(result.current.isBlockedByAnotherTab).toBe(true),
        );

        expect(result.current.isDoneHydratingFromIdb).toBe(false);
        expect(captureMessage).toHaveBeenCalledWith(
          'settings_db_open_blocked',
          { level: 'warning' },
        );

        oldConnection.close();
        isOldConnectionOpen = false;

        await waitFor(() =>
          expect(result.current.isDoneHydratingFromIdb).toBe(true),
        );

        expect(result.current.isBlockedByAnotherTab).toBe(false);
        expect(captureMessage).not.toHaveBeenCalledWith(
          'settings_db_open_failed',
          expect.anything(),
        );

        await act(() =>
          result.current.setEpisodeSettingsItem(
            EPISODE_REFERENCE,
            EPISODE_SETTINGS_ITEM,
          ),
        );

        expect(
          result.current.getEpisodeSettingsItem(EPISODE_REFERENCE),
        ).toEqual(EPISODE_SETTINGS_ITEM);
        expect(await readDatabase()).toEqual({
          counts: [1, 0],
          storeNames: UPGRADED_STORE_NAMES,
          version: 7,
        });
      } finally {
        if (isOldConnectionOpen) {
          oldConnection.close();
        }
      }
    });

    it('should keep the wait past the time limit of 5 seconds', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      const openRequest = Object.setPrototypeOf(
        new EventTarget(),
        IDBOpenDBRequest.prototype,
      );

      vi.spyOn(indexedDB, 'open').mockReturnValue(openRequest);

      const { result } = renderSettingsContext();

      act(() => {
        openRequest.dispatchEvent(new Event('blocked'));
      });
      await act(() => vi.advanceTimersByTimeAsync(60_000));

      expect(result.current.isBlockedByAnotherTab).toBe(true);
      expect(result.current.isDoneHydratingFromIdb).toBe(false);
      expect(captureMessage).not.toHaveBeenCalledWith(
        'settings_db_open_failed',
        expect.anything(),
      );
    });
  });

  describe('open failures', () => {
    it('should end hydration with empty state when the open does not settle within 5 seconds', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      vi.spyOn(indexedDB, 'open').mockReturnValue(
        Object.setPrototypeOf(new EventTarget(), IDBOpenDBRequest.prototype),
      );

      const { result } = renderSettingsContext();

      await act(() => vi.advanceTimersByTimeAsync(4999));

      expect(result.current.isDoneHydratingFromIdb).toBe(false);

      await act(() => vi.advanceTimersByTimeAsync(1));

      expect(result.current.isDoneHydratingFromIdb).toBe(true);
      expect(
        result.current.getEpisodeSettingsItem(EPISODE_REFERENCE),
      ).toBeUndefined();
      expect(result.current.hydratedMediaPlayerSettings).toBeUndefined();
      expect(captureMessage).toHaveBeenCalledWith(
        'settings_db_open_failed',
        expect.objectContaining({
          extra: expect.objectContaining({ reason: 'timeout' }),
        }),
      );
    });

    it('should end hydration with empty state when the database has a newer version', async () => {
      const newerDatabase = await openDB(DATABASE_NAME, 8, {
        upgrade(upgradeDatabase) {
          UPGRADED_STORE_NAMES.forEach((storeName) => {
            upgradeDatabase.createObjectStore(storeName);
          });
        },
      });

      await newerDatabase.put(
        'episodeSettings',
        EPISODE_SETTINGS_ITEM,
        VERSION_6_EPISODE_KEY,
      );
      await newerDatabase.put(
        'mediaPlayerSettings',
        MEDIA_PLAYER_SETTINGS,
        'mediaPlayerSettings',
      );
      newerDatabase.close();

      const { result } = await renderHydratedSettingsContext();

      expect(
        result.current.getEpisodeSettingsItem(EPISODE_REFERENCE),
      ).toBeUndefined();
      expect(result.current.hydratedMediaPlayerSettings).toBeUndefined();
      expect(captureMessage).toHaveBeenCalledWith(
        'settings_db_open_failed',
        expect.objectContaining({
          extra: { errorName: 'VersionError', reason: 'open_failed' },
        }),
      );
    });
  });

  describe('connection lifecycle', () => {
    it('should not write after another tab upgrades the database', async () => {
      const { result } = await renderHydratedSettingsContext();
      const newerConnection = await openDB(DATABASE_NAME, 8);

      try {
        await act(() =>
          result.current.setEpisodeSettingsItem(
            EPISODE_REFERENCE,
            EPISODE_SETTINGS_ITEM,
          ),
        );

        expect(
          result.current.getEpisodeSettingsItem(EPISODE_REFERENCE),
        ).toBeUndefined();
        expect(await newerConnection.count('episodeSettings')).toBe(0);
      } finally {
        newerConnection.close();
      }
    });

    it('should close every database handle on unmount in Strict Mode', async () => {
      const openSpy = vi.spyOn(indexedDB, 'open');
      const closeSpy = vi.spyOn(IDBDatabase.prototype, 'close');
      const { result, unmount } = renderHook(() => useSettingsContext(), {
        wrapper: ({ children }: PropsWithChildren) => (
          <StrictMode>
            <SettingsProvider>{children}</SettingsProvider>
          </StrictMode>
        ),
      });

      await waitFor(() =>
        expect(result.current.isDoneHydratingFromIdb).toBe(true),
      );

      unmount();

      await waitFor(() =>
        expect(closeSpy).toHaveBeenCalledTimes(openSpy.mock.calls.length),
      );
      expect(openSpy.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('writes', () => {
    it('should keep the mirror and log an event when a write fails', async () => {
      const { result } = await renderHydratedSettingsContext();

      await act(() =>
        result.current.setEpisodeSettingsItem(EPISODE_REFERENCE, {
          // A function cannot be cloned, so the write fails.
          currentTime: (() => {}) as unknown as number,
        }),
      );

      expect(
        result.current.getEpisodeSettingsItem(EPISODE_REFERENCE),
      ).toBeUndefined();
      expect(captureMessage).toHaveBeenCalledWith(
        'settings_db_write_failed',
        expect.objectContaining({
          extra: { errorName: 'DataCloneError', storeName: 'episodeSettings' },
        }),
      );
    });

    it('should keep a saved position after a new render of the provider', async () => {
      const firstRender = await renderHydratedSettingsContext();

      await act(() =>
        firstRender.result.current.setEpisodeSettingsItem(
          EPISODE_REFERENCE,
          EPISODE_SETTINGS_ITEM,
        ),
      );
      firstRender.unmount();

      const { result } = await renderHydratedSettingsContext();

      expect(result.current.getEpisodeSettingsItem(EPISODE_REFERENCE)).toEqual(
        EPISODE_SETTINGS_ITEM,
      );
    });
  });

  describe('keys', () => {
    it('should give one feed key to a feed URL with an uppercase host and a fragment', async () => {
      const { result } = await renderHydratedSettingsContext();

      await act(() =>
        result.current.setEpisodeSettingsItem(
          {
            episodeIdentity: 'episode-1',
            feedUrl: 'https://EXAMPLE.com/feed.xml#latest',
          },
          { currentTime: 30 },
        ),
      );
      await act(() =>
        result.current.setEpisodeSettingsItem(EPISODE_REFERENCE, {
          currentTime: 60,
        }),
      );

      expect(
        result.current.getEpisodeSettingsItem({
          episodeIdentity: 'episode-1',
          feedUrl: 'https://Example.com/feed.xml',
        }),
      ).toEqual({ currentTime: 60 });
      expect((await readDatabase()).counts).toEqual([1, 0]);
    });

    it('should give two feed keys to feed URLs that differ only in the query case', async () => {
      const { result } = await renderHydratedSettingsContext();

      await act(() =>
        result.current.setEpisodeSettingsItem(
          {
            episodeIdentity: 'episode-1',
            feedUrl: 'https://example.com/feed.xml?token=ABC',
          },
          { currentTime: 10 },
        ),
      );
      await act(() =>
        result.current.setEpisodeSettingsItem(
          {
            episodeIdentity: 'episode-1',
            feedUrl: 'https://example.com/feed.xml?token=abc',
          },
          { currentTime: 20 },
        ),
      );

      expect(
        result.current.getEpisodeSettingsItem({
          episodeIdentity: 'episode-1',
          feedUrl: 'https://example.com/feed.xml?token=ABC',
        }),
      ).toEqual({ currentTime: 10 });
      expect((await readDatabase()).counts).toEqual([2, 0]);
    });

    it('should give an episode key that matches only its own guid when the guid holds a quote and a comma', async () => {
      const { result } = await renderHydratedSettingsContext();

      await act(() =>
        result.current.setEpisodeSettingsItem(
          { episodeIdentity: 'a","b', feedUrl: FEED_URL },
          { currentTime: 30 },
        ),
      );

      expect(
        result.current.getEpisodeSettingsItem({
          episodeIdentity: 'a","b',
          feedUrl: FEED_URL,
        }),
      ).toEqual({ currentTime: 30 });
      expect(
        result.current.getEpisodeSettingsItem({
          episodeIdentity: 'a',
          feedUrl: FEED_URL,
        }),
      ).toBeUndefined();
      expect(
        result.current.getEpisodeSettingsItem({
          episodeIdentity: 'b',
          feedUrl: `${FEED_URL}","a`,
        }),
      ).toBeUndefined();
    });
  });

  describe('media player settings', () => {
    it('should hydrate a stored player state with a feed URL and an identity', async () => {
      const firstRender = await renderHydratedSettingsContext();

      await act(() =>
        firstRender.result.current.setMediaPlayerSettings(
          MEDIA_PLAYER_SETTINGS,
        ),
      );
      firstRender.unmount();

      const { result } = await renderHydratedSettingsContext();

      expect(result.current.hydratedMediaPlayerSettings).toEqual(
        MEDIA_PLAYER_SETTINGS,
      );
    });

    it('should drop a stored player state with numeric ids', async () => {
      const database = await openDB(DATABASE_NAME, 6, {
        upgrade(upgradeDatabase) {
          OLD_STORE_NAMES.forEach((storeName) => {
            upgradeDatabase.createObjectStore(storeName);
          });
        },
      });

      await database.put(
        'mediaPlayerSettings',
        VERSION_5_MEDIA_PLAYER_SETTINGS,
        'mediaPlayerSettings',
      );
      database.close();

      const { result } = await renderHydratedSettingsContext();

      expect(result.current.hydratedMediaPlayerSettings).toBeUndefined();
    });
  });
});

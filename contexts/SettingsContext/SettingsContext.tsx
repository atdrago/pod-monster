'use client';

import { captureMessage } from '@sentry/nextjs';
import { openDB } from 'idb';
import {
  type FunctionComponent,
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { DBSchema, IDBPDatabase, StoreNames } from 'idb';

import { normalizeFeedUrl } from 'utils/normalizeFeedUrl';
import type { EpisodeReference, FeedReference } from 'utils/paths';
import type { PlaybackRate } from 'utils/playbackRates';

interface EpisodeSettingsItem {
  currentTime: number;
  duration?: number;
}

type EpisodeSettings = Record<string, EpisodeSettingsItem>;

interface FeedSettingsItem {
  htmlUrl?: string;
  image?: string;
  /** Present when Podcast Index knows the show. */
  podcastIndexId?: number;
  subscribedAt: string | null;
  title: string;
  type?: 'rss' | 'atom';
}

/** Each key is a feed URL. */
export type FeedSettings = Record<string, FeedSettingsItem>;

type MediaPlayerSettings = {
  chaptersUrl: string | null;
  episodeIdentity: string | null;
  episodeImage: string | null;
  episodeImageDimensions: { height: number; width: number } | null;
  episodeTitle: string | null;
  feedImage: string | null;
  feedTitle: string | null;
  feedUrl: string | null;
  isMuted: boolean;
  isPaused: boolean;
  isTranscriptVisibleAsSubtitle: boolean;
  playbackRate: PlaybackRate;
  size: 1 | 2;
  src: string | null;
  srcType: string | null;
  volume: number;
};

type HydratedMediaPlayerSettings = MediaPlayerSettings & EpisodeReference;

interface PodMonsterDb extends DBSchema {
  episodeSettings: {
    key: string;
    value: EpisodeSettingsItem;
  };
  feedSettings: {
    key: string;
    value: FeedSettingsItem;
  };
  mediaPlayerSettings: {
    key: 'mediaPlayerSettings';
    value: MediaPlayerSettings;
  };
}

interface SettingsContext {
  feedSettings: FeedSettings;
  getEpisodeSettingsItem: (
    episodeReference: EpisodeReference,
  ) => EpisodeSettingsItem | undefined;
  getFeedSettingsItem: (
    feedReference: FeedReference,
  ) => FeedSettingsItem | undefined;
  /** The player state that the database held when hydration ended. */
  hydratedMediaPlayerSettings?: HydratedMediaPlayerSettings;
  /**
   * True while a tab with an old version of the site keeps the database open,
   * and so blocks the upgrade. Hydration ends when the visitor closes that
   * tab.
   */
  isBlockedByAnotherTab: boolean;
  isDoneHydratingFromIdb: boolean;
  /** Replaces the library. Each key of `nextFeedSettings` is a feed URL. */
  setAllFeedSettings: (nextFeedSettings: FeedSettings) => Promise<void>;
  setEpisodeSettingsItem: (
    episodeReference: EpisodeReference,
    value: EpisodeSettingsItem,
  ) => Promise<void>;
  setFeedSettingsItem: (
    feedReference: FeedReference,
    value: FeedSettingsItem,
  ) => Promise<void>;
  setMediaPlayerSettings: (value: MediaPlayerSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContext>({
  feedSettings: {},
  getEpisodeSettingsItem: (_) => undefined,
  getFeedSettingsItem: (_) => undefined,
  isBlockedByAnotherTab: false,
  isDoneHydratingFromIdb: false,
  setAllFeedSettings: async (_) => {},
  setEpisodeSettingsItem: async (_) => {},
  setFeedSettingsItem: async (_) => {},
  setMediaPlayerSettings: async (_) => {},
});

const DATABASE_NAME = 'pod.monster';
const SETTINGS_VERSION = 6;
const HYDRATION_TIME_LIMIT_MS = 5000;
const LEGACY_LOCAL_STORAGE_KEY = 'pod2.settings';
const MEDIA_PLAYER_SETTINGS_KEY = 'mediaPlayerSettings';
const STORE_NAMES: Array<StoreNames<PodMonsterDb>> = [
  'episodeSettings',
  'feedSettings',
  'mediaPlayerSettings',
];

type HydrationFailureReason = 'open_failed' | 'read_failed' | 'timeout';

let lastFeedKeyInput: string | undefined;
let lastFeedKeyResult: string | null = null;

/**
 * Each row of a list asks for the key of the same feed URL. Thus, the function
 * keeps the last input and its result.
 */
const getFeedKey = (feedUrl: string): string | null => {
  if (feedUrl === lastFeedKeyInput) {
    return lastFeedKeyResult;
  }

  const feedKey = normalizeFeedUrl(feedUrl);

  lastFeedKeyInput = feedUrl;
  lastFeedKeyResult = feedKey;

  return feedKey;
};

/**
 * The JSON array form keeps an identity with `"` or `,` from a match with the
 * key of another episode.
 */
const getEpisodeKey = ({
  episodeIdentity,
  feedUrl,
}: EpisodeReference): string | null => {
  const feedKey = getFeedKey(feedUrl);

  return feedKey === null ? null : JSON.stringify([feedKey, episodeIdentity]);
};

/**
 * A record from version 5 has numeric ids and no feed URL, so this guard drops
 * it. It also drops a record with no episode.
 */
const isHydratedMediaPlayerSettings = (
  value: unknown,
): value is HydratedMediaPlayerSettings =>
  typeof value === 'object' &&
  value !== null &&
  'feedUrl' in value &&
  typeof value.feedUrl === 'string' &&
  'episodeIdentity' in value &&
  typeof value.episodeIdentity === 'string';

/**
 * True when the stored item has the same fields as the next item. A state
 * updater then returns the previous state, so React skips the render.
 */
const hasEqualFields = <TItem extends object>(
  storedItem: TItem | undefined,
  nextItem: TItem,
): boolean => {
  if (storedItem === undefined) {
    return false;
  }

  const storedEntries = Object.entries(storedItem);
  const nextFields = new Map(Object.entries(nextItem));

  return (
    storedEntries.length === nextFields.size &&
    storedEntries.every(
      ([key, storedValue]) =>
        nextFields.has(key) && Object.is(nextFields.get(key), storedValue),
    )
  );
};

const getErrorName = (error: unknown) =>
  error instanceof Error ? error.name : 'unknown';

const logWriteFailure = (
  storeName: StoreNames<PodMonsterDb>,
  error: unknown,
) => {
  captureMessage('settings_db_write_failed', {
    extra: { errorName: getErrorName(error), storeName },
    level: 'warning',
  });
};

const logInvalidFeedUrl = (storeName: StoreNames<PodMonsterDb>) => {
  captureMessage('settings_invalid_feed_url', {
    extra: { storeName },
    level: 'warning',
  });
};

/**
 * Version 6 keys the data by feed URL. The data under the Podcast Index ids of
 * an older version does not carry over. Each call here is synchronous, so the
 * upgrade transaction does not commit early.
 */
const upgradeDatabase = (
  database: IDBPDatabase<PodMonsterDb>,
  oldVersion: number,
) => {
  if (oldVersion < 6) {
    STORE_NAMES.forEach((storeName) => {
      if (database.objectStoreNames.contains(storeName)) {
        database.deleteObjectStore(storeName);
      }

      database.createObjectStore(storeName);
    });

    try {
      window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
    } catch {
      // A browser that blocks storage throws here. No code reads the key.
    }
  }
};

const readSettings = async (database: IDBPDatabase<PodMonsterDb>) => {
  const transaction = database.transaction(STORE_NAMES, 'readonly');
  const episodeSettingsStore = transaction.objectStore('episodeSettings');
  const feedSettingsStore = transaction.objectStore('feedSettings');
  const [
    episodeKeys,
    episodeValues,
    feedKeys,
    feedValues,
    storedMediaPlayerSettings,
  ] = await Promise.all([
    episodeSettingsStore.getAllKeys(),
    episodeSettingsStore.getAll(),
    feedSettingsStore.getAllKeys(),
    feedSettingsStore.getAll(),
    transaction
      .objectStore('mediaPlayerSettings')
      .get(MEDIA_PLAYER_SETTINGS_KEY),
    transaction.done,
  ]);
  const episodeSettings: EpisodeSettings = Object.fromEntries(
    episodeKeys.map((episodeKey, index) => [episodeKey, episodeValues[index]]),
  );
  const feedSettings: FeedSettings = Object.fromEntries(
    feedKeys.map((feedKey, index) => [feedKey, feedValues[index]]),
  );

  return {
    episodeSettings,
    feedSettings,
    hydratedMediaPlayerSettings: isHydratedMediaPlayerSettings(
      storedMediaPlayerSettings,
    )
      ? storedMediaPlayerSettings
      : undefined,
  };
};

export const SettingsProvider: FunctionComponent<
  PropsWithChildren<unknown>
> = ({ children }) => {
  const [episodeSettings, setEpisodeSettings] = useState<EpisodeSettings>({});
  const [feedSettings, setFeedSettings] = useState<FeedSettings>({});
  const [hydratedMediaPlayerSettings, setHydratedMediaPlayerSettings] =
    useState<HydratedMediaPlayerSettings | undefined>();
  const [isBlockedByAnotherTab, setIsBlockedByAnotherTab] = useState(false);
  const [isDoneHydratingFromIdb, setIsDoneHydratingFromIdb] = useState(false);
  const databaseRef = useRef<IDBPDatabase<PodMonsterDb> | null>(null);

  /**
   * Open the database and hydrate the state. Hydration ends within the time
   * limit. An open failure or the time limit ends it with empty state, and
   * writes then do nothing until a reload. An old tab that runs the version 5
   * code cannot close its connection, so it blocks the upgrade until the
   * visitor closes it. A blocked open thus has no time limit: the page asks
   * the visitor to close the old tab, and hydrates when the open completes.
   */
  useEffect(() => {
    let database: IDBPDatabase<PodMonsterDb> | null = null;
    let hasHydrationEnded = false;
    let isUnmounted = false;

    const closeDatabase = () => {
      if (database === null) {
        return;
      }

      database.close();

      if (databaseRef.current === database) {
        databaseRef.current = null;
      }

      database = null;
    };

    const endHydrationWithEmptyState = (
      reason: HydrationFailureReason,
      error?: unknown,
    ) => {
      if (hasHydrationEnded || isUnmounted) {
        return;
      }

      hasHydrationEnded = true;
      clearTimeout(hydrationTimeoutId);
      closeDatabase();
      captureMessage('settings_db_open_failed', {
        extra:
          error === undefined
            ? { reason }
            : { errorName: getErrorName(error), reason },
        level: 'warning',
      });
      setIsBlockedByAnotherTab(false);
      setIsDoneHydratingFromIdb(true);
    };

    const waitForAnotherTab = () => {
      if (hasHydrationEnded || isUnmounted) {
        return;
      }

      clearTimeout(hydrationTimeoutId);
      captureMessage('settings_db_open_blocked', { level: 'warning' });
      setIsBlockedByAnotherTab(true);
    };

    const openAndHydrate = async () => {
      let openedDatabase: IDBPDatabase<PodMonsterDb>;

      try {
        openedDatabase = await openDB<PodMonsterDb>(
          DATABASE_NAME,
          SETTINGS_VERSION,
          {
            blocked: waitForAnotherTab,
            // Another tab opens a newer version. Close, so that its upgrade
            // can go on, and stop the writes of this tab.
            blocking: closeDatabase,
            terminated: closeDatabase,
            upgrade: upgradeDatabase,
          },
        );
      } catch (error) {
        endHydrationWithEmptyState('open_failed', error);

        return;
      }

      if (hasHydrationEnded || isUnmounted) {
        openedDatabase.close();

        return;
      }

      database = openedDatabase;

      let settings: Awaited<ReturnType<typeof readSettings>>;

      try {
        settings = await readSettings(openedDatabase);
      } catch (error) {
        endHydrationWithEmptyState('read_failed', error);

        return;
      }

      if (hasHydrationEnded || isUnmounted) {
        return;
      }

      hasHydrationEnded = true;
      clearTimeout(hydrationTimeoutId);
      // A versionchange during the read closes the database and sets it to
      // `null`. The state then hydrates, but writes do nothing.
      databaseRef.current = database;
      setEpisodeSettings(settings.episodeSettings);
      setFeedSettings(settings.feedSettings);
      setHydratedMediaPlayerSettings(settings.hydratedMediaPlayerSettings);
      setIsBlockedByAnotherTab(false);
      setIsDoneHydratingFromIdb(true);
    };

    const hydrationTimeoutId = setTimeout(
      () => endHydrationWithEmptyState('timeout'),
      HYDRATION_TIME_LIMIT_MS,
    );

    openAndHydrate();

    return () => {
      isUnmounted = true;
      clearTimeout(hydrationTimeoutId);
      closeDatabase();
    };
  }, []);

  const getEpisodeSettingsItem = useCallback(
    (episodeReference: EpisodeReference): EpisodeSettingsItem | undefined => {
      const episodeKey = getEpisodeKey(episodeReference);

      return episodeKey === null ? undefined : episodeSettings[episodeKey];
    },
    [episodeSettings],
  );

  const getFeedSettingsItem = useCallback(
    (feedReference: FeedReference): FeedSettingsItem | undefined => {
      const feedKey = getFeedKey(feedReference.feedUrl);

      return feedKey === null ? undefined : feedSettings[feedKey];
    },
    [feedSettings],
  );

  const setEpisodeSettingsItem = useCallback(
    async (episodeReference: EpisodeReference, value: EpisodeSettingsItem) => {
      const database = databaseRef.current;

      if (database === null) {
        return;
      }

      const episodeKey = getEpisodeKey(episodeReference);

      if (episodeKey === null) {
        logInvalidFeedUrl('episodeSettings');

        return;
      }

      try {
        await database.put('episodeSettings', value, episodeKey);
      } catch (error) {
        logWriteFailure('episodeSettings', error);

        return;
      }

      setEpisodeSettings((previousEpisodeSettings) =>
        hasEqualFields(previousEpisodeSettings[episodeKey], value)
          ? previousEpisodeSettings
          : { ...previousEpisodeSettings, [episodeKey]: value },
      );
    },
    [],
  );

  const setFeedSettingsItem = useCallback(
    async (feedReference: FeedReference, value: FeedSettingsItem) => {
      const database = databaseRef.current;

      if (database === null) {
        return;
      }

      const feedKey = getFeedKey(feedReference.feedUrl);

      if (feedKey === null) {
        logInvalidFeedUrl('feedSettings');

        return;
      }

      try {
        await database.put('feedSettings', value, feedKey);
      } catch (error) {
        logWriteFailure('feedSettings', error);

        return;
      }

      setFeedSettings((previousFeedSettings) =>
        hasEqualFields(previousFeedSettings[feedKey], value)
          ? previousFeedSettings
          : { ...previousFeedSettings, [feedKey]: value },
      );
    },
    [],
  );

  const setAllFeedSettings = useCallback(
    async (nextFeedSettings: FeedSettings) => {
      const database = databaseRef.current;

      if (database === null) {
        return;
      }

      const nextFeedSettingsByKey: FeedSettings = {};

      Object.entries(nextFeedSettings).forEach(
        ([feedUrl, feedSettingsItem]) => {
          const feedKey = getFeedKey(feedUrl);

          if (feedKey === null) {
            logInvalidFeedUrl('feedSettings');

            return;
          }

          nextFeedSettingsByKey[feedKey] = feedSettingsItem;
        },
      );

      try {
        const transaction = database.transaction('feedSettings', 'readwrite');

        await Promise.all([
          transaction.store.clear(),
          ...Object.entries(nextFeedSettingsByKey).map(
            ([feedKey, feedSettingsItem]) =>
              transaction.store.put(feedSettingsItem, feedKey),
          ),
          transaction.done,
        ]);
      } catch (error) {
        logWriteFailure('feedSettings', error);

        return;
      }

      setFeedSettings(nextFeedSettingsByKey);
    },
    [],
  );

  const setMediaPlayerSettings = useCallback(
    async (value: MediaPlayerSettings) => {
      const database = databaseRef.current;

      if (database === null) {
        return;
      }

      try {
        await database.put(
          'mediaPlayerSettings',
          value,
          MEDIA_PLAYER_SETTINGS_KEY,
        );
      } catch (error) {
        logWriteFailure('mediaPlayerSettings', error);
      }
    },
    [],
  );

  return (
    <SettingsContext.Provider
      value={{
        feedSettings,
        getEpisodeSettingsItem,
        getFeedSettingsItem,
        hydratedMediaPlayerSettings,
        isBlockedByAnotherTab,
        isDoneHydratingFromIdb,
        setAllFeedSettings,
        setEpisodeSettingsItem,
        setFeedSettingsItem,
        setMediaPlayerSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = (): SettingsContext =>
  useContext(SettingsContext);

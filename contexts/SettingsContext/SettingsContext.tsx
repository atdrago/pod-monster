import { IDBPDatabase, openDB } from 'idb';
import {
  FunctionComponent,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import type {
  EpisodeSettings,
  FeedSettings,
  IEpisodeSettingsItem,
  IFeedSettingsItem,
  IPodMonsterDb,
  ISettingsContext,
  MediaPlayerSettings,
} from 'types';

import { migrateFrom0To5 } from './migrations/migrateFrom0To5';

const SettingsContext = createContext<ISettingsContext>({
  /* eslint-disable @typescript-eslint/no-empty-function */
  episodeSettings: {},
  feedSettings: {},
  idbHydrationPromise: null,
  isDoneHydratingFromIdb: false,
  setAllFeedSettings: async (_) => {},
  setEpisodeSettingsItem: async (_) => {},
  setFeedSettingsItem: async (_) => {},
  setMediaPlayerSettings: (_) => {},
  /* eslint-enable @typescript-eslint/no-empty-function */
});

const SETTINGS_VERSION = 5;

let idbHydrationPromiseResolver: (() => void) | null = null;
const idbHydrationPromise = new Promise<void>((resolve) => {
  idbHydrationPromiseResolver = resolve;
});

export const SettingsProvider: FunctionComponent<
  PropsWithChildren<unknown>
> = ({ children }) => {
  const [mediaPlayerSettings, setMediaPlayerSettings] = useState<
    MediaPlayerSettings | undefined
  >();
  const [episodeSettings, setEpisodeSettings] = useState<EpisodeSettings>({});
  const [feedSettings, setFeedSettings] = useState<FeedSettings>({});
  const [isDoneHydratingFromIdb, setIsDoneHydratingFromIdb] = useState(false);
  const databaseRef = useRef<IDBPDatabase<IPodMonsterDb> | null>(null);

  // Open the database, do any necessary migrations, and populate context state
  // from IDB.
  useEffect(() => {
    (async () => {
      let oldVersion: number | null = null;

      databaseRef.current = await openDB<IPodMonsterDb>(
        'pod.monster',
        SETTINGS_VERSION,
        {
          upgrade: async (upgradeDb, upgradeOldVersion, upgradeNewVersion) => {
            if (!upgradeNewVersion || upgradeNewVersion <= 5) {
              upgradeDb.createObjectStore('episodeSettings');
              upgradeDb.createObjectStore('feedSettings');
              upgradeDb.createObjectStore('mediaPlayerSettings');
            }

            oldVersion = upgradeOldVersion;
          },
        }
      );

      // Migrations
      if (oldVersion !== SETTINGS_VERSION) {
        if (oldVersion === 0 && SETTINGS_VERSION === 5) {
          await migrateFrom0To5(databaseRef.current);
        }
      }

      const nextEpisodeSettings: EpisodeSettings = {};
      const nextFeedSettings: FeedSettings = {};
      const nextMediaPlayerSettings = await databaseRef.current.get(
        'mediaPlayerSettings',
        'mediaPlayerSettings'
      );

      let episodeSettingsCursor = await databaseRef.current
        .transaction('episodeSettings')
        .store.openCursor();

      while (episodeSettingsCursor) {
        nextEpisodeSettings[episodeSettingsCursor.key] =
          episodeSettingsCursor.value;

        episodeSettingsCursor = await episodeSettingsCursor.continue();
      }

      let feedSettingsCursor = await databaseRef.current
        .transaction('feedSettings')
        .store.openCursor();

      while (feedSettingsCursor) {
        nextFeedSettings[feedSettingsCursor.key] = feedSettingsCursor.value;

        feedSettingsCursor = await feedSettingsCursor.continue();
      }

      setEpisodeSettings(nextEpisodeSettings);
      setFeedSettings(nextFeedSettings);
      setMediaPlayerSettings(nextMediaPlayerSettings);

      if (idbHydrationPromiseResolver) {
        idbHydrationPromiseResolver();
      }

      setIsDoneHydratingFromIdb(true);
    })();
  }, []);

  // Write mediaPlayerSettings when they change
  useEffect(() => {
    if (isDoneHydratingFromIdb && databaseRef.current && mediaPlayerSettings) {
      databaseRef.current.put(
        'mediaPlayerSettings',
        mediaPlayerSettings,
        'mediaPlayerSettings'
      );
    }
  }, [mediaPlayerSettings, isDoneHydratingFromIdb]);

  /**
   * Sets a single episode settings item
   */
  const setEpisodeSettingsItem = useCallback(
    async (key: string, value: IEpisodeSettingsItem) => {
      if (!databaseRef.current) {
        return;
      }

      await databaseRef.current.put('episodeSettings', value, key);

      setEpisodeSettings((prevEpisodeSettings) => ({
        ...prevEpisodeSettings,
        [key]: value,
      }));
    },
    []
  );

  /**
   * Sets a single feed settings item
   */
  const setFeedSettingsItem = useCallback(
    async (key: string, value: IFeedSettingsItem) => {
      if (!databaseRef.current) {
        return;
      }

      await databaseRef.current?.put('feedSettings', value, key);

      setFeedSettings((prevFeedSettings) => ({
        ...prevFeedSettings,
        [key]: value,
      }));
    },
    []
  );

  /**
   * Clears all feed settings and overwrites them with the passed feed settings
   */
  const setAllFeedSettings = useCallback(
    async (nextFeedSettings: FeedSettings) => {
      if (databaseRef.current) {
        const transaction = databaseRef.current.transaction(
          'feedSettings',
          'readwrite'
        );

        await transaction.store.clear();

        await Promise.all([
          ...Object.entries(nextFeedSettings ?? []).map(
            ([feedId, feedSettingsItem]) =>
              transaction.store.put(feedSettingsItem, feedId)
          ),
          transaction.done,
        ]);

        setFeedSettings(nextFeedSettings);
      }
    },
    []
  );

  return (
    <SettingsContext.Provider
      value={{
        episodeSettings,
        feedSettings,
        idbHydrationPromise,
        isDoneHydratingFromIdb,
        mediaPlayerSettings,
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

export const useSettingsContext = (): ISettingsContext =>
  useContext(SettingsContext);

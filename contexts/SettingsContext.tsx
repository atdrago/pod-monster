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
  LocalStorageSettings,
  MediaPlayerSettings,
} from 'types';
import { tryLocalStorageGetItem } from 'utils/localStorage';
import { logger } from 'utils/logger';

const SettingsContext = createContext<ISettingsContext>({
  /* eslint-disable @typescript-eslint/no-empty-function */
  episodeSettings: {},
  feedSettings: {},
  hydrationPromise: null,
  isDoneHydratingFromIdb: false,
  setAllFeedSettings: async (_) => {},
  setEpisodeSettingsItem: async (_) => {},
  setFeedSettingsItem: async (_) => {},
  setMediaPlayerSettings: (_) => {},
  /* eslint-enable @typescript-eslint/no-empty-function */
});

const SETTINGS_VERSION = 5;

let hydrationPromiseResolver: (() => void) | null = null;
const hydrationPromise = new Promise<void>((resolve) => {
  hydrationPromiseResolver = resolve;
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

  // Open the db
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

      // Initial migration from localStorage to IndexedDB
      if (oldVersion === 0 && databaseRef.current.version === 5) {
        const settingsFromLocalStorage =
          tryLocalStorageGetItem('pod2.settings');

        let settings: LocalStorageSettings | null = null;

        if (settingsFromLocalStorage) {
          try {
            settings = JSON.parse(
              settingsFromLocalStorage
            ) as LocalStorageSettings;
          } catch (err) {
            logger.error(err);
          }
        }

        if (settings?.episodeSettings) {
          const episodeSettingsMigrationTransaction =
            databaseRef.current.transaction('episodeSettings', 'readwrite');

          await Promise.all([
            ...Object.entries(settings?.episodeSettings ?? []).map(
              ([episodeId, episodeSettingsItem]) =>
                episodeSettingsMigrationTransaction.store.put(
                  episodeSettingsItem,
                  episodeId
                )
            ),
            episodeSettingsMigrationTransaction.done,
          ]);
        }

        if (settings?.feedSettings) {
          const feedSettingsMigrationTransaction =
            databaseRef.current.transaction('feedSettings', 'readwrite');

          await Promise.all([
            ...Object.entries(settings?.feedSettings ?? []).map(
              ([feedId, feedSettingsItem]) =>
                feedSettingsMigrationTransaction.store.put(
                  feedSettingsItem,
                  feedId
                )
            ),
            feedSettingsMigrationTransaction.done,
          ]);
        }

        if (settings?.audioPlayerSettings) {
          const mediaPlayerSettingsMigrationTransaction =
            databaseRef.current.transaction('mediaPlayerSettings', 'readwrite');

          await Promise.all([
            mediaPlayerSettingsMigrationTransaction.store.put(
              settings.audioPlayerSettings,
              'mediaPlayerSettings'
            ),
            mediaPlayerSettingsMigrationTransaction.done,
          ]);
        }
      }

      const mediaPlayerSettingsFromIdb = await databaseRef.current.get(
        'mediaPlayerSettings',
        'mediaPlayerSettings'
      );
      const nextEpisodeSettings: EpisodeSettings = {};
      const nextFeedSettings: FeedSettings = {};

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
      setMediaPlayerSettings(mediaPlayerSettingsFromIdb);
      hydrationPromiseResolver && hydrationPromiseResolver();
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
        hydrationPromise,
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

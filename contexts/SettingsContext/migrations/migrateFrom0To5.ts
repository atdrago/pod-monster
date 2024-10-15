import { captureException } from '@sentry/nextjs';
import { IDBPDatabase } from 'idb';

import type { IPodMonsterDb, LocalStorageSettings } from 'types';
import { tryLocalStorageGetItem } from 'utils/localStorage';

/**
 * Initial migration from localStorage to IndexedDB
 * @param database
 */
export const migrateFrom0To5 = async (
  database: IDBPDatabase<IPodMonsterDb>,
) => {
  const settingsFromLocalStorage = tryLocalStorageGetItem('pod2.settings');

  let settingsJsonFromLocalStorage: LocalStorageSettings | null = null;

  if (settingsFromLocalStorage) {
    try {
      settingsJsonFromLocalStorage = JSON.parse(
        settingsFromLocalStorage,
      ) as LocalStorageSettings;
    } catch (err) {
      captureException(err);
    }
  }

  if (settingsJsonFromLocalStorage?.episodeSettings) {
    const episodeSettingsMigrationTransaction = database.transaction(
      'episodeSettings',
      'readwrite',
    );

    await Promise.all([
      ...Object.entries(
        settingsJsonFromLocalStorage?.episodeSettings ?? [],
      ).map(([episodeId, episodeSettingsItem]) =>
        episodeSettingsMigrationTransaction.store.put(
          episodeSettingsItem,
          episodeId,
        ),
      ),
      episodeSettingsMigrationTransaction.done,
    ]);
  }

  if (settingsJsonFromLocalStorage?.feedSettings) {
    const feedSettingsMigrationTransaction = database.transaction(
      'feedSettings',
      'readwrite',
    );

    await Promise.all([
      ...Object.entries(settingsJsonFromLocalStorage?.feedSettings ?? []).map(
        ([feedId, feedSettingsItem]) =>
          feedSettingsMigrationTransaction.store.put(feedSettingsItem, feedId),
      ),
      feedSettingsMigrationTransaction.done,
    ]);
  }

  if (settingsJsonFromLocalStorage?.audioPlayerSettings) {
    const mediaPlayerSettingsMigrationTransaction = database.transaction(
      'mediaPlayerSettings',
      'readwrite',
    );

    await Promise.all([
      mediaPlayerSettingsMigrationTransaction.store.put(
        settingsJsonFromLocalStorage.audioPlayerSettings,
        'mediaPlayerSettings',
      ),
      mediaPlayerSettingsMigrationTransaction.done,
    ]);
  }
};

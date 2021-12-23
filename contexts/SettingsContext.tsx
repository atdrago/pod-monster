import {
  FunctionComponent,
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { fetchOpmlV3ToV4 } from 'rest/fetchOpmlV3ToV4';
import type {
  EpisodeSettings,
  FeedSettings,
  ISettingsContext,
  LocalStorageSettings,
  MediaPlayerSettings,
} from 'types';
import {
  tryLocalStorageGetItem,
  tryLocalStorageRemoveItem,
  tryLocalStorageSetItem,
} from 'utils/localStorage';
import { logger } from 'utils/logger';

const SettingsContext = createContext<ISettingsContext>({
  /* eslint-disable @typescript-eslint/no-empty-function */
  episodeSettings: {},
  feedSettings: {},
  isDoneHydratingFromLocalStorage: false,
  setEpisodeSettings: (_) => {},
  setFeedSettings: (_) => {},
  setMediaPlayerSettings: (_) => {},
  /* eslint-enable @typescript-eslint/no-empty-function */
});

const SETTINGS_VERSION = 5;

export const SettingsProvider: FunctionComponent<
  PropsWithChildren<unknown>
> = ({ children }) => {
  const [mediaPlayerSettings, setMediaPlayerSettings] = useState<
    MediaPlayerSettings | undefined
  >();
  const [episodeSettings, setEpisodeSettings] = useState<EpisodeSettings>({});
  const [feedSettings, setFeedSettings] = useState<FeedSettings>({});
  const [isDoneHydratingFromLocalStorage, setIsDoneHydratingFromLocalStorage] =
    useState(false);

  // Read from localStorage on mount
  useEffect(() => {
    (async () => {
      const settingsFromLocalStorage = tryLocalStorageGetItem('pod2.settings');

      let settings: LocalStorageSettings | null = null;

      if (settingsFromLocalStorage) {
        try {
          settings = JSON.parse(
            settingsFromLocalStorage
          ) as LocalStorageSettings;
        } catch (err) {
          // TODO: Capture exception?
        }
      }

      if (settings) {
        if (settings._version === SETTINGS_VERSION) {
          setMediaPlayerSettings(settings.audioPlayerSettings);
          setEpisodeSettings(settings.episodeSettings);
          setFeedSettings(settings.feedSettings);
        } else if (SETTINGS_VERSION > settings._version) {
          /**
           * Settings versions migrations happen here. Always use the conditional
           * ```
           * if (settings._version < N && SETTINGS_VERSION >= N) {
           * ```
           * and make sure N is ordered from lowest to highest. This will make it
           * so that future migrations always can rely on the previous version's
           * configuration.
           */

          let tmpMediaPlayerSettings: MediaPlayerSettings | null = null;
          // let tmpEpisodeSettings: EpisodeSettings | null = null;
          let tmpFeedSettings: FeedSettings | null = null;

          // In 2, at `feedSettings[i]`, `isSubscribed` became `subscribedAt`
          if (settings._version < 2 && SETTINGS_VERSION >= 2) {
            tmpFeedSettings = Object.fromEntries(
              Object.entries(settings.feedSettings).map(
                ([key, { isSubscribed, ...tmpFeedSetting }]) => {
                  return [
                    key,
                    {
                      ...tmpFeedSetting,
                      subscribedAt: isSubscribed ? new Date().toJSON() : null,
                    },
                  ];
                }
              )
            );
          }

          // In 3, `isPlayerOpen` changed to `size`. `true` was the equivalent of
          // 2 and `false` was the equivalent
          if (settings._version < 3 && SETTINGS_VERSION >= 3) {
            const { isPlayerOpen, ...nextTmpMediaPlayerSettings } =
              settings.audioPlayerSettings;

            tmpMediaPlayerSettings = nextTmpMediaPlayerSettings;

            tmpMediaPlayerSettings.size = isPlayerOpen ? 2 : 1;
          }

          // In 4, `htmlUrl`, `type`, and `xmlUrl` were added to feed settings in
          // order to support OPML import / export
          if (settings._version < 4 && SETTINGS_VERSION >= 4) {
            try {
              const ids = Object.keys(tmpFeedSettings || settings.feedSettings);
              const data = await fetchOpmlV3ToV4(ids);

              if (data && 'feedSettings' in data) {
                tmpFeedSettings = data.feedSettings;
              }
            } catch (err) {
              // Do nothing
            }
          }

          // In 5, `playbackRate` was added to audio player settings
          if (settings._version < 5 && SETTINGS_VERSION >= 5) {
            tmpMediaPlayerSettings = {
              ...settings.audioPlayerSettings,
            };

            tmpMediaPlayerSettings.playbackRate = 1;
          }

          if (
            tmpFeedSettings ||
            tmpMediaPlayerSettings /** || tmpEpisodeSettings */
          ) {
            // If any migrations were found, use them.
            setMediaPlayerSettings(
              tmpMediaPlayerSettings || settings.audioPlayerSettings
            );
            setEpisodeSettings(settings.episodeSettings);
            setFeedSettings(tmpFeedSettings || settings.feedSettings);

            logger.info(
              `Successfully migrated settings from ${settings._version} to ${SETTINGS_VERSION}`
            );
          } else {
            // If no migrations were found, we have an incompatible version, so bail.
            tryLocalStorageRemoveItem('pod2.settings');
          }
        }
      }

      setIsDoneHydratingFromLocalStorage(true);
    })();
  }, []);

  // Write to localStorage when any settings change
  useEffect(() => {
    try {
      tryLocalStorageSetItem(
        'pod2.settings',
        JSON.stringify({
          _version: SETTINGS_VERSION,
          audioPlayerSettings: mediaPlayerSettings,
          episodeSettings,
          feedSettings,
        })
      );
    } catch (err) {
      // TODO: Capture exception?
    }
  }, [mediaPlayerSettings, episodeSettings, feedSettings]);

  return (
    <SettingsContext.Provider
      value={{
        episodeSettings,
        feedSettings,
        isDoneHydratingFromLocalStorage,
        mediaPlayerSettings,
        setEpisodeSettings,
        setFeedSettings,
        setMediaPlayerSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = (): ISettingsContext =>
  useContext(SettingsContext);

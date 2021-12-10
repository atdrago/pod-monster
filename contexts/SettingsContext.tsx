import {
  Dispatch,
  FunctionComponent,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  tryLocalStorageGetItem,
  tryLocalStorageRemoveItem,
  tryLocalStorageSetItem,
} from 'utils/localStorage';

type EpisodeSettings = Record<
  string,
  {
    currentTime: number;
  }
>;

type FeedSettings = Record<
  string,
  {
    image: string;
    /**
     * @deprecated - use `subscribedAt` instead
     */
    isSubscribed?: boolean;
    subscribedAt: string | null;
    title: string;
  }
>;

type AudioPlayerSettings = {
  chaptersUrl: string | null;
  currentTime: number;
  dateCrawled: number | null;
  episodeId: number | null;
  episodeImage: string | null;
  episodeTitle: string | null;
  feedId: number | null;
  feedImage: string | null;
  feedTitle: string | null;
  /**
   * Should only be true for default values
   */
  isDefaults?: boolean;
  isMuted: boolean;
  /**
   * @deprecated - use `size` instead (true = 2, false = 1)
   */
  isPlayerOpen?: boolean;
  size: number;
  src: string | null;
  volume: number;
};

type LocalStorageSettings = {
  _version: number;
  audioPlayerSettings: AudioPlayerSettings;
  episodeSettings: EpisodeSettings;
  feedSettings: FeedSettings;
};

interface ISettingsContext {
  audioPlayerSettings?: AudioPlayerSettings;
  episodeSettings: EpisodeSettings;
  feedSettings: FeedSettings;
  isDoneHydratingFromLocalStorage: boolean;
  setAudioPlayerSettings: Dispatch<
    SetStateAction<AudioPlayerSettings | undefined>
  >;
  setEpisodeSettings: Dispatch<SetStateAction<EpisodeSettings>>;
  setFeedSettings: Dispatch<SetStateAction<FeedSettings>>;
}

export const SettingsContext = createContext<ISettingsContext>({
  /* eslint-disable @typescript-eslint/no-empty-function */
  episodeSettings: {},
  feedSettings: {},
  isDoneHydratingFromLocalStorage: false,
  setAudioPlayerSettings: (_) => {},
  setEpisodeSettings: (_) => {},
  setFeedSettings: (_) => {},
  /* eslint-enable @typescript-eslint/no-empty-function */
});

const SETTINGS_VERSION = 3;

export const SettingsProvider: FunctionComponent<
  PropsWithChildren<unknown>
> = ({ children }) => {
  const [audioPlayerSettings, setAudioPlayerSettings] = useState<
    AudioPlayerSettings | undefined
  >();
  const [episodeSettings, setEpisodeSettings] = useState<EpisodeSettings>({});
  const [feedSettings, setFeedSettings] = useState<FeedSettings>({});
  const [isDoneHydratingFromLocalStorage, setIsDoneHydratingFromLocalStorage] =
    useState(false);

  // Read from localStorage on mount
  useEffect(() => {
    const settingsFromLocalStorage = tryLocalStorageGetItem('pod2.settings');

    let settings: LocalStorageSettings | null = null;

    if (settingsFromLocalStorage) {
      try {
        settings = JSON.parse(settingsFromLocalStorage) as LocalStorageSettings;
      } catch (err) {
        // TODO: Capture exception?
      }
    }

    if (settings) {
      if (settings._version === SETTINGS_VERSION) {
        setAudioPlayerSettings(settings.audioPlayerSettings);
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

        let tmpAudioPlayerSettings: AudioPlayerSettings | null = null;
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
          const { isPlayerOpen, ...nextTmpAudioPlayerSettings } =
            settings.audioPlayerSettings;

          tmpAudioPlayerSettings = nextTmpAudioPlayerSettings;

          tmpAudioPlayerSettings.size = isPlayerOpen ? 2 : 1;
        }

        if (
          tmpFeedSettings ||
          tmpAudioPlayerSettings /** || tmpEpisodeSettings */
        ) {
          // If any migrations were found, use them.
          setAudioPlayerSettings(
            tmpAudioPlayerSettings || settings.audioPlayerSettings
          );
          setEpisodeSettings(settings.episodeSettings);
          setFeedSettings(tmpFeedSettings || settings.feedSettings);
        } else {
          // If no migrations were found, we have an incompatible version, so bail.
          tryLocalStorageRemoveItem('pod2.settings');
        }
      }
    }

    setIsDoneHydratingFromLocalStorage(true);
  }, []);

  // Write to localStorage when any settings change
  useEffect(() => {
    try {
      tryLocalStorageSetItem(
        'pod2.settings',
        JSON.stringify({
          _version: SETTINGS_VERSION,
          audioPlayerSettings,
          episodeSettings,
          feedSettings,
        })
      );
    } catch (err) {
      // TODO: Capture exception?
    }
  }, [audioPlayerSettings, episodeSettings, feedSettings]);

  return (
    <SettingsContext.Provider
      value={{
        audioPlayerSettings,
        episodeSettings,
        feedSettings,
        isDoneHydratingFromLocalStorage,
        setAudioPlayerSettings,
        setEpisodeSettings,
        setFeedSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = (): ISettingsContext =>
  useContext(SettingsContext);

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
    isSubscribed?: boolean;
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
  isPlayerOpen: boolean;
  src: string | null;
  volume: number;
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

const SETTINGS_VERSION = '1';

export const SettingsProvider: FunctionComponent<PropsWithChildren<unknown>> =
  ({ children }) => {
    const [audioPlayerSettings, setAudioPlayerSettings] = useState<
      AudioPlayerSettings | undefined
    >();
    const [episodeSettings, setEpisodeSettings] = useState<EpisodeSettings>({});
    const [feedSettings, setFeedSettings] = useState<FeedSettings>({});
    const [
      isDoneHydratingFromLocalStorage,
      setIsDoneHydratingFromLocalStorage,
    ] = useState(false);

    // Read from localStorage on mount
    useEffect(() => {
      const settingsFromLocalStorage = tryLocalStorageGetItem('pod2.settings');

      let settings = null;

      if (settingsFromLocalStorage) {
        try {
          settings = JSON.parse(settingsFromLocalStorage);
        } catch (err) {
          // TODO: Capture exception?
        }
      }

      if (settings) {
        if (settings._version === SETTINGS_VERSION) {
          setAudioPlayerSettings(settings.audioPlayerSettings);
          setEpisodeSettings(settings.episodeSettings);
          setFeedSettings(settings.feedSettings);
        } else {
          tryLocalStorageRemoveItem('pod2.settings');
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

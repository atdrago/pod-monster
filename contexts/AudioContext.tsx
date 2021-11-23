import {
  Dispatch,
  FunctionComponent,
  MutableRefObject,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useQuery } from 'react-query';

import { useSettingsContext } from 'contexts/SettingsContext';
import { useStateWithDebounce } from 'hooks/useStateWithDebounce';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';
import type { IChapter } from 'types';

interface IAudioContext {
  audioPlayerCurrentTime: number;
  audioPlayerCurrentTimeDebounced: number;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  chapters: Array<IChapter> | null | undefined;
  chaptersUrl: string | null;
  currentChapter: IChapter | null;
  currentChapterIndex: number;
  currentTime: number;
  dateCrawled: number | null;
  episodeId: number | null;
  episodeImage: string | null;
  episodeTitle: string | null;
  feedImage: string | null;
  feedTitle: string | null;
  isMuted: boolean;
  isPaused: boolean;
  isPlayerOpen: boolean;
  setAudioPlayerCurrentTime: Dispatch<SetStateAction<number>>;
  setChaptersUrl: Dispatch<SetStateAction<string | null>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  setDateCrawled: Dispatch<SetStateAction<number | null>>;
  setEpisodeId: Dispatch<SetStateAction<number | null>>;
  setEpisodeImage: Dispatch<SetStateAction<string | null>>;
  setEpisodeTitle: Dispatch<SetStateAction<string | null>>;
  setFeedImage: Dispatch<SetStateAction<string | null>>;
  setFeedTitle: Dispatch<SetStateAction<string | null>>;
  setIsMuted: Dispatch<SetStateAction<boolean>>;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
  setIsPlayerOpen: Dispatch<SetStateAction<boolean>>;
  setSrc: Dispatch<SetStateAction<string | null>>;
  setVolume: Dispatch<SetStateAction<number>>;
  src: string | null;
  volume: number;
}

export const audioContextDefaults: IAudioContext = {
  /* eslint-disable @typescript-eslint/no-empty-function */
  audioPlayerCurrentTime: 0,
  audioPlayerCurrentTimeDebounced: 0,
  audioRef: { current: null },
  chapters: null,
  chaptersUrl: null,
  currentChapter: null,
  currentChapterIndex: -1,
  currentTime: 0,
  dateCrawled: null,
  episodeId: null,
  episodeImage: null,
  episodeTitle: null,
  feedImage: null,
  feedTitle: null,
  isMuted: false,
  isPaused: true,
  isPlayerOpen: false,
  setAudioPlayerCurrentTime: (_) => {},
  setChaptersUrl: (_) => {},
  setCurrentTime: (_) => {},
  setDateCrawled: (_) => {},
  setEpisodeId: (_) => {},
  setEpisodeImage: (_) => {},
  setEpisodeTitle: (_) => {},
  setFeedImage: (_) => {},
  setFeedTitle: (_) => {},
  setIsMuted: (_) => {},
  setIsPaused: (_) => {},
  setIsPlayerOpen: (_) => {},
  setSrc: (_) => {},
  setVolume: (_) => {},
  src: null,
  volume: 1,
  /* eslint-enable @typescript-eslint/no-empty-function */
};

export const AudioContext = createContext<IAudioContext | undefined>(undefined);

export const AudioProvider: FunctionComponent<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const {
    audioPlayerSettings,
    isDoneHydratingFromLocalStorage,
    setAudioPlayerSettings,
    setEpisodeSettings,
  } = useSettingsContext();
  const audioPlayerSettingsRef = useRef(audioPlayerSettings);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [chaptersUrl, setChaptersUrl] = useState<string | null>(
    audioContextDefaults.chaptersUrl
  );
  const [
    audioPlayerCurrentTime,
    audioPlayerCurrentTimeDebounced,
    setAudioPlayerCurrentTime,
  ] = useStateWithDebounce(audioContextDefaults.currentTime, 500, {
    maxWait: 5000,
  });
  const [currentTime, setCurrentTime] = useState(
    audioContextDefaults.currentTime
  );
  const [dateCrawled, setDateCrawled] = useState<number | null>(
    audioContextDefaults.dateCrawled
  );
  const [episodeId, setEpisodeId] = useState<number | null>(
    audioContextDefaults.episodeId
  );
  const [episodeImage, setEpisodeImage] = useState(
    audioContextDefaults.episodeImage
  );
  const [episodeTitle, setEpisodeTitle] = useState(
    audioContextDefaults.episodeTitle
  );
  const [feedImage, setFeedImage] = useState(audioContextDefaults.feedImage);
  const [feedTitle, setFeedTitle] = useState(audioContextDefaults.feedTitle);
  const [isMuted, setIsMuted] = useState<boolean>(audioContextDefaults.isMuted);
  const [isPaused, setIsPaused] = useState<boolean>(
    audioContextDefaults.isPaused
  );
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(
    audioContextDefaults.isPlayerOpen
  );
  const [src, setSrc] = useState<string | null>(audioContextDefaults.src);
  const [volume, setVolume] = useState<number>(audioContextDefaults.volume);

  const { data: chapters } = useQuery(
    ['chapters', chaptersUrl, dateCrawled],
    async () => await fetchPodcastEpisodeChapters(chaptersUrl),
    {
      enabled:
        typeof dateCrawled === 'number' &&
        typeof chaptersUrl === 'string' &&
        chaptersUrl.length > 0,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const hasChapters = chapters && chapters.length > 0;
  const currentChapterIndex = hasChapters
    ? chapters.findIndex(({ startTime: chapterStartTime }) => {
        return audioPlayerCurrentTime < (chapterStartTime ?? 0);
      }) - 1
    : -1;
  const currentChapter =
    hasChapters && currentChapterIndex >= 0
      ? chapters[currentChapterIndex]
      : null;

  const isFirstRenderAfterHydration =
    audioPlayerSettings &&
    !audioPlayerSettingsRef.current &&
    isDoneHydratingFromLocalStorage;

  useEffect(() => {
    if (isFirstRenderAfterHydration) {
      setChaptersUrl(audioPlayerSettings.chaptersUrl);
      setAudioPlayerCurrentTime(audioPlayerSettings.currentTime);
      setCurrentTime(audioPlayerSettings.currentTime);
      setDateCrawled(audioPlayerSettings.dateCrawled);
      setEpisodeId(audioPlayerSettings.episodeId);
      setIsMuted(audioPlayerSettings.isMuted);
      setIsPlayerOpen(audioPlayerSettings.isPlayerOpen);
      setSrc(audioPlayerSettings.src);
      setFeedImage(audioPlayerSettings.feedImage);
      setFeedTitle(audioPlayerSettings.feedTitle);
      setEpisodeTitle(audioPlayerSettings.episodeTitle);
      setEpisodeImage(audioPlayerSettings.episodeImage);
      setVolume(audioPlayerSettings.volume);
    }

    audioPlayerSettingsRef.current = audioPlayerSettings;
  }, [
    audioPlayerSettings,
    isDoneHydratingFromLocalStorage,
    setAudioPlayerCurrentTime,
    setCurrentTime,
    isFirstRenderAfterHydration,
  ]);

  /**
   * Update the episode settings when the audio element's `currentTime`
   * property changes, but debounce `currentTime`. The debouncing causes the
   * settings to only be updated if the `currentTime` stops changing for 500ms,
   * but will never wait longer than 5 seconds to update the settings.
   */
  useEffect(() => {
    if (episodeId && isDoneHydratingFromLocalStorage) {
      setEpisodeSettings((prevEpisodeSettings) => ({
        ...prevEpisodeSettings,
        [episodeId]: {
          currentTime: audioPlayerCurrentTimeDebounced,
        },
      }));
    }
  }, [
    audioPlayerCurrentTimeDebounced,
    isDoneHydratingFromLocalStorage,
    episodeId,
    setEpisodeSettings,
  ]);

  useEffect(() => {
    if (isDoneHydratingFromLocalStorage) {
      setAudioPlayerSettings({
        chaptersUrl,
        currentTime: audioPlayerCurrentTimeDebounced,
        dateCrawled,
        episodeId,
        episodeImage,
        episodeTitle,
        feedImage,
        feedTitle,
        isMuted,
        isPlayerOpen,
        src,
        volume,
      });
    }
  }, [
    audioPlayerCurrentTimeDebounced,
    chaptersUrl,
    dateCrawled,
    episodeId,
    episodeImage,
    episodeTitle,
    feedImage,
    feedTitle,
    isDoneHydratingFromLocalStorage,
    isFirstRenderAfterHydration,
    isMuted,
    isPlayerOpen,
    setAudioPlayerSettings,
    src,
    volume,
  ]);

  useEffect(() => {
    if ('mediaSession' in window.navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        album: currentChapter?.title ?? undefined,
        artist: episodeTitle ?? undefined,
        artwork: [
          {
            sizes: '512x512',
            src: currentChapter?.img || episodeImage || feedImage || '',
          },
        ],
        title: feedTitle ?? undefined,
      });
    }
  }, [
    currentChapter?.img,
    currentChapter?.title,
    episodeImage,
    episodeTitle,
    feedImage,
    feedTitle,
  ]);

  return (
    <AudioContext.Provider
      value={{
        audioPlayerCurrentTime,
        audioPlayerCurrentTimeDebounced,
        audioRef,
        chapters,
        chaptersUrl,
        currentChapter,
        currentChapterIndex,
        currentTime,
        dateCrawled,
        episodeId,
        episodeImage,
        episodeTitle,
        feedImage,
        feedTitle,
        isMuted,
        isPaused,
        isPlayerOpen,
        setAudioPlayerCurrentTime,
        setChaptersUrl,
        setCurrentTime,
        setDateCrawled,
        setEpisodeId,
        setEpisodeImage,
        setEpisodeTitle,
        setFeedImage,
        setFeedTitle,
        setIsMuted,
        setIsPaused,
        setIsPlayerOpen,
        setSrc,
        setVolume,
        src,
        volume,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudioContext = (): IAudioContext | undefined =>
  useContext(AudioContext);

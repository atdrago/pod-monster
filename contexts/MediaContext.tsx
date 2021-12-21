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
import { useQuery } from 'react-query';

import { useSettingsContext } from 'contexts/SettingsContext';
import { useStateWithDebounce } from 'hooks/useStateWithDebounce';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';
import type { IMediaContext, PlaybackRate } from 'types';

export const mediaContextDefaults: IMediaContext = {
  /* eslint-disable @typescript-eslint/no-empty-function */
  audioRef: { current: null },
  chapters: null,
  chaptersUrl: null,
  currentChapter: null,
  currentChapterIndex: -1,
  currentTime: 0,
  dateCrawled: null,
  episodeId: null,
  episodeImage: null,
  episodeImageDimensions: null,
  episodeTitle: null,
  feedId: null,
  feedImage: null,
  feedTitle: null,
  isMuted: false,
  isPaused: true,
  mediaPlayerCurrentTime: 0,
  mediaPlayerCurrentTimeDebounced: 0,
  playPause: () => {},
  playbackRate: 1,
  resetMediaContext: () => {},
  seekBackward: () => {},
  seekForward: () => {},
  setChaptersUrl: (_) => {},
  setCurrentTime: (_) => {},
  setDateCrawled: (_) => {},
  setEpisodeId: (_) => {},
  setEpisodeImage: (_) => {},
  setEpisodeImageDimensions: (_) => {},
  setEpisodeTitle: (_) => {},
  setFeedId: (_) => {},
  setFeedImage: (_) => {},
  setFeedTitle: (_) => {},
  setIsMuted: (_) => {},
  setIsPaused: (_) => {},
  setMediaPlayerCurrentTime: (_) => {},
  setPlaybackRate: (_) => {},
  setSize: (_) => {},
  setSrc: (_) => {},
  setSrcType: (_) => {},
  setVolume: (_) => {},
  size: 1,
  src: null,
  srcType: null,
  videoRef: { current: null },
  volume: 1,
  /* eslint-enable @typescript-eslint/no-empty-function */
};

const MediaContext = createContext<IMediaContext | undefined>(undefined);

export const MediaProvider: FunctionComponent<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const {
    isDoneHydratingFromLocalStorage,
    mediaPlayerSettings,
    setEpisodeSettings,
    setMediaPlayerSettings,
  } = useSettingsContext();
  const mediaPlayerSettingsRef = useRef(mediaPlayerSettings);

  const [chaptersUrl, setChaptersUrl] = useState<string | null>(
    mediaContextDefaults.chaptersUrl
  );
  const [
    mediaPlayerCurrentTime,
    mediaPlayerCurrentTimeDebounced,
    setMediaPlayerCurrentTime,
  ] = useStateWithDebounce(mediaContextDefaults.currentTime, 500, {
    maxWait: 5000,
  });
  const [currentTime, setCurrentTime] = useState(
    mediaContextDefaults.currentTime
  );
  const [dateCrawled, setDateCrawled] = useState<number | null>(
    mediaContextDefaults.dateCrawled
  );
  const [episodeId, setEpisodeId] = useState<number | null>(
    mediaContextDefaults.episodeId
  );
  const [episodeImage, setEpisodeImage] = useState(
    mediaContextDefaults.episodeImage
  );
  const [episodeImageDimensions, setEpisodeImageDimensions] = useState(
    mediaContextDefaults.episodeImageDimensions
  );
  const [episodeTitle, setEpisodeTitle] = useState(
    mediaContextDefaults.episodeTitle
  );
  const [feedId, setFeedId] = useState(mediaContextDefaults.feedId);
  const [feedImage, setFeedImage] = useState(mediaContextDefaults.feedImage);
  const [feedTitle, setFeedTitle] = useState(mediaContextDefaults.feedTitle);
  const [isMuted, setIsMuted] = useState<boolean>(mediaContextDefaults.isMuted);
  const [isPaused, setIsPaused] = useState<boolean>(
    mediaContextDefaults.isPaused
  );
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1);
  const [src, setSrc] = useState<string | null>(mediaContextDefaults.src);
  const [srcType, setSrcType] = useState<string | null>(
    mediaContextDefaults.srcType
  );
  const [size, setSize] = useState<1 | 2>(mediaContextDefaults.size);
  const [volume, setVolume] = useState<number>(mediaContextDefaults.volume);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
        return mediaPlayerCurrentTime < (chapterStartTime ?? 0);
      }) - 1
    : -1;
  const currentChapter =
    hasChapters && currentChapterIndex >= 0
      ? chapters[currentChapterIndex]
      : null;

  const isFirstRenderAfterHydration =
    mediaPlayerSettings &&
    !mediaPlayerSettingsRef.current &&
    isDoneHydratingFromLocalStorage;

  const resetMediaContext = () => {
    audioRef.current?.pause();
    videoRef.current?.pause();

    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }

    setChaptersUrl(mediaContextDefaults.chaptersUrl);
    setDateCrawled(mediaContextDefaults.dateCrawled);
    setEpisodeId(mediaContextDefaults.episodeId);
    setEpisodeImage(mediaContextDefaults.episodeImage);
    setEpisodeImageDimensions(mediaContextDefaults.episodeImageDimensions);
    setEpisodeTitle(mediaContextDefaults.episodeTitle);
    setFeedId(mediaContextDefaults.feedId);
    setFeedImage(mediaContextDefaults.feedImage);
    setFeedTitle(mediaContextDefaults.feedTitle);
    setIsMuted(mediaContextDefaults.isMuted);
    setIsPaused(mediaContextDefaults.isPaused);
    setPlaybackRate(mediaContextDefaults.playbackRate);
    setSize(mediaContextDefaults.size);
    setSrc(mediaContextDefaults.src);
    setSrcType(mediaContextDefaults.srcType);
    setVolume(mediaContextDefaults.volume);
  };

  const seekBackward = useCallback(
    ({ seekOffset }) => {
      const resultTime = mediaPlayerCurrentTime - seekOffset;

      setCurrentTime(resultTime);
    },
    [mediaPlayerCurrentTime]
  );

  const seekForward = useCallback(
    ({ seekOffset }) => {
      const resultTime = mediaPlayerCurrentTime + seekOffset;

      setCurrentTime(resultTime);
    },
    [mediaPlayerCurrentTime]
  );

  const playPause = useCallback(async () => {
    const nextIsPaused = !isPaused;

    setIsPaused(nextIsPaused);

    if (audioRef.current) {
      if (nextIsPaused) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    }

    if (videoRef.current) {
      if (nextIsPaused) {
        videoRef.current.pause();
      } else {
        await videoRef.current.play();
      }
    }
  }, [isPaused]);

  useEffect(() => {
    if (isFirstRenderAfterHydration) {
      setChaptersUrl(mediaPlayerSettings.chaptersUrl);
      setCurrentTime(mediaPlayerSettings.currentTime);
      setDateCrawled(mediaPlayerSettings.dateCrawled);
      setEpisodeId(mediaPlayerSettings.episodeId);
      setEpisodeImage(mediaPlayerSettings.episodeImage);
      setEpisodeImageDimensions(mediaPlayerSettings.episodeImageDimensions);
      setEpisodeTitle(mediaPlayerSettings.episodeTitle);
      setFeedId(mediaPlayerSettings.feedId);
      setFeedImage(mediaPlayerSettings.feedImage);
      setFeedTitle(mediaPlayerSettings.feedTitle);
      setIsMuted(mediaPlayerSettings.isMuted);
      setMediaPlayerCurrentTime(mediaPlayerSettings.currentTime);
      setPlaybackRate(mediaPlayerSettings.playbackRate);
      setSize(mediaPlayerSettings.size);
      setSrc(mediaPlayerSettings.src);
      setSrcType(mediaPlayerSettings.srcType);
      setVolume(mediaPlayerSettings.volume);
    }

    mediaPlayerSettingsRef.current = mediaPlayerSettings;
  }, [
    mediaPlayerSettings,
    isDoneHydratingFromLocalStorage,
    setMediaPlayerCurrentTime,
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
          currentTime: mediaPlayerCurrentTimeDebounced,
        },
      }));
    }
  }, [
    mediaPlayerCurrentTimeDebounced,
    isDoneHydratingFromLocalStorage,
    episodeId,
    setEpisodeSettings,
  ]);

  useEffect(() => {
    if (isDoneHydratingFromLocalStorage) {
      setMediaPlayerSettings({
        chaptersUrl,
        currentTime: mediaPlayerCurrentTimeDebounced,
        dateCrawled,
        episodeId,
        episodeImage,
        episodeImageDimensions,
        episodeTitle,
        feedId,
        feedImage,
        feedTitle,
        isMuted,
        playbackRate,
        size,
        src,
        srcType,
        volume,
      });
    }
  }, [
    chaptersUrl,
    dateCrawled,
    episodeId,
    episodeImage,
    episodeImageDimensions,
    episodeTitle,
    feedId,
    feedImage,
    feedTitle,
    isDoneHydratingFromLocalStorage,
    isFirstRenderAfterHydration,
    isMuted,
    mediaPlayerCurrentTimeDebounced,
    playbackRate,
    setMediaPlayerSettings,
    size,
    src,
    srcType,
    volume,
  ]);

  /**
   * Set MediaSession metadata whenever any piece of it changes.
   */
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

  /**
   * Set MediaSession action handlers.
   */
  useEffect(() => {
    if ('mediaSession' in window.navigator) {
      navigator.mediaSession.setActionHandler('play', playPause);
      navigator.mediaSession.setActionHandler('pause', playPause);
      navigator.mediaSession.setActionHandler('stop', null);
      navigator.mediaSession.setActionHandler('seekbackward', seekBackward);
      navigator.mediaSession.setActionHandler('seekforward', seekForward);
      navigator.mediaSession.setActionHandler('seekto', ({ seekTime }) => {
        if (typeof seekTime === 'number') {
          setCurrentTime(seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    }

    return () => {
      if ('mediaSession' in window.navigator) {
        // Note: This un-setting may be unnecessary but it seems like the right
        // thing to do when the player unmounts
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekto', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }
    };
  }, [playPause, seekBackward, seekForward]);

  /**
   * Update `mediaPlayerCurrentTime` whenever `currentTime` changes (via calls
   * to `setCurrentTime()`)
   * */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = currentTime;
    }

    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }

    setMediaPlayerCurrentTime(currentTime);
  }, [audioRef, videoRef, currentTime, setMediaPlayerCurrentTime]);

  return (
    <MediaContext.Provider
      value={{
        audioRef,
        chapters,
        chaptersUrl,
        currentChapter,
        currentChapterIndex,
        currentTime,
        dateCrawled,
        episodeId,
        episodeImage,
        episodeImageDimensions,
        episodeTitle,
        feedId,
        feedImage,
        feedTitle,
        isMuted,
        isPaused,
        mediaPlayerCurrentTime,
        mediaPlayerCurrentTimeDebounced,
        playPause,
        playbackRate,
        resetMediaContext,
        seekBackward,
        seekForward,
        setChaptersUrl,
        setCurrentTime,
        setDateCrawled,
        setEpisodeId,
        setEpisodeImage,
        setEpisodeImageDimensions,
        setEpisodeTitle,
        setFeedId,
        setFeedImage,
        setFeedTitle,
        setIsMuted,
        setIsPaused,
        setMediaPlayerCurrentTime,
        setPlaybackRate,
        setSize,
        setSrc,
        setSrcType,
        setVolume,
        size,
        src,
        srcType,
        videoRef,
        volume,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export const useMediaContext = (): IMediaContext | undefined =>
  useContext(MediaContext);

import { useQuery } from '@tanstack/react-query';
import {
  type FunctionComponent,
  type PropsWithChildren,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useSettingsContext } from 'contexts/SettingsContext';
import { useStateWithDebounce } from 'hooks/useStateWithDebounce';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';
import type { Chapter } from 'types';
import { bufferedTimeRangesToTuples } from 'utils/bufferedTimeRangesToTuples';
import type { PlaybackRate } from 'utils/playbackRates';

interface MediaContext {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  chapters: Array<Chapter> | null | undefined;
  chaptersUrl: string | null;
  currentChapter: Chapter | null;
  currentChapterIndex: number;
  currentTime: number;
  dateCrawled: number | null;
  didError: boolean;
  duration: number;
  episodeId: number | null;
  episodeImage: string | null;
  episodeImageDimensions: { height: number; width: number } | null;
  episodeTitle: string | null;
  feedId: number | null;
  feedImage: string | null;
  feedTitle: string | null;
  isLoadingAtCurrentTime: boolean;
  isMuted: boolean;
  isPaused: boolean;
  isTranscriptVisibleAsSubtitle: boolean;
  mediaPlayerCurrentTime: number;
  mediaPlayerCurrentTimeDebounced: number;
  pause: () => void;
  play: () => Promise<void>;
  playPause: () => Promise<void>;
  playbackRate: PlaybackRate;
  progressEventBufferedTuples: Array<[number, number]>;
  resetMediaContext: () => void;
  seekBackward: (details: Partial<MediaSessionActionDetails>) => void;
  seekForward: (details: Partial<MediaSessionActionDetails>) => void;
  setChaptersUrl: Dispatch<SetStateAction<string | null>>;
  setCurrentTime: Dispatch<SetStateAction<number>>;
  setDateCrawled: Dispatch<SetStateAction<number | null>>;
  setDidError: Dispatch<SetStateAction<boolean>>;
  setDuration: Dispatch<SetStateAction<number>>;
  setEpisodeId: Dispatch<SetStateAction<number | null>>;
  setEpisodeImage: Dispatch<SetStateAction<string | null>>;
  setEpisodeImageDimensions: Dispatch<
    SetStateAction<{ height: number; width: number } | null>
  >;
  setEpisodeTitle: Dispatch<SetStateAction<string | null>>;
  setFeedId: Dispatch<SetStateAction<number | null>>;
  setFeedImage: Dispatch<SetStateAction<string | null>>;
  setFeedTitle: Dispatch<SetStateAction<string | null>>;
  setIsMuted: Dispatch<SetStateAction<boolean>>;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
  setIsTranscriptVisibleAsSubtitle: Dispatch<SetStateAction<boolean>>;
  setMediaPlayerCurrentTime: Dispatch<SetStateAction<number>>;
  setPlaybackRate: Dispatch<SetStateAction<PlaybackRate>>;
  setProgressEventBufferedTuples: Dispatch<
    SetStateAction<Array<[number, number]>>
  >;
  setSize: Dispatch<SetStateAction<1 | 2>>;
  setSrc: Dispatch<SetStateAction<string | null>>;
  setSrcType: Dispatch<SetStateAction<string | null>>;
  setVolume: Dispatch<SetStateAction<number>>;
  size: 1 | 2;
  src: string | null;
  srcType: string | null;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  volume: number;
}

const mediaContextDefaults: MediaContext = {
  audioRef: { current: null },
  chapters: null,
  chaptersUrl: null,
  currentChapter: null,
  currentChapterIndex: -1,
  currentTime: 0,
  dateCrawled: null,
  didError: false,
  duration: 0,
  episodeId: null,
  episodeImage: null,
  episodeImageDimensions: null,
  episodeTitle: null,
  feedId: null,
  feedImage: null,
  feedTitle: null,
  isLoadingAtCurrentTime: false,
  isMuted: false,
  isPaused: true,
  isTranscriptVisibleAsSubtitle: true,
  mediaPlayerCurrentTime: 0,
  mediaPlayerCurrentTimeDebounced: 0,
  pause: () => {},
  play: async () => {},
  playPause: async () => {},
  playbackRate: 1,
  progressEventBufferedTuples: [],
  resetMediaContext: () => {},
  seekBackward: () => {},
  seekForward: () => {},
  setChaptersUrl: (_) => {},
  setCurrentTime: (_) => {},
  setDateCrawled: (_) => {},
  setDidError: (_) => {},
  setDuration: (_) => {},
  setEpisodeId: (_) => {},
  setEpisodeImage: (_) => {},
  setEpisodeImageDimensions: (_) => {},
  setEpisodeTitle: (_) => {},
  setFeedId: (_) => {},
  setFeedImage: (_) => {},
  setFeedTitle: (_) => {},
  setIsMuted: (_) => {},
  setIsPaused: (_) => {},
  setIsTranscriptVisibleAsSubtitle: (_) => {},
  setMediaPlayerCurrentTime: (_) => {},
  setPlaybackRate: (_) => {},
  setProgressEventBufferedTuples: (_) => {},
  setSize: (_) => {},
  setSrc: (_) => {},
  setSrcType: (_) => {},
  setVolume: (_) => {},
  size: 1,
  src: null,
  srcType: null,
  videoRef: { current: null },
  volume: 1,
};

const MediaContext = createContext<MediaContext | undefined>(undefined);

export const DEFAULT_SEEK_BACKWARD_OFFSET = 15;
export const DEFAULT_SEEK_FORWARD_OFFSET = 30;

export const MediaProvider: FunctionComponent<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const {
    idbHydrationPromise,
    isDoneHydratingFromIdb,
    mediaPlayerSettings,
    setEpisodeSettingsItem,
    setMediaPlayerSettings,
  } = useSettingsContext();
  const mediaPlayerSettingsRef = useRef(mediaPlayerSettings);

  const [chaptersUrl, setChaptersUrl] = useState<string | null>(
    mediaContextDefaults.chaptersUrl,
  );
  const [
    mediaPlayerCurrentTime,
    mediaPlayerCurrentTimeDebounced,
    setMediaPlayerCurrentTime,
  ] = useStateWithDebounce(mediaContextDefaults.currentTime, 500, {
    maxWait: 5000,
  });
  const [progressEventBufferedTuples, setProgressEventBufferedTuples] =
    useState(mediaContextDefaults.progressEventBufferedTuples);
  const [currentTime, setCurrentTime] = useState(
    mediaContextDefaults.currentTime,
  );
  const [dateCrawled, setDateCrawled] = useState<number | null>(
    mediaContextDefaults.dateCrawled,
  );
  const [duration, setDuration] = useState<number>(
    mediaContextDefaults.duration,
  );
  const [didError, setDidError] = useState(false);
  const [episodeId, setEpisodeId] = useState<number | null>(
    mediaContextDefaults.episodeId,
  );
  const [episodeImage, setEpisodeImage] = useState(
    mediaContextDefaults.episodeImage,
  );
  const [episodeImageDimensions, setEpisodeImageDimensions] = useState(
    mediaContextDefaults.episodeImageDimensions,
  );
  const [episodeTitle, setEpisodeTitle] = useState(
    mediaContextDefaults.episodeTitle,
  );
  const [feedId, setFeedId] = useState(mediaContextDefaults.feedId);
  const [feedImage, setFeedImage] = useState(mediaContextDefaults.feedImage);
  const [feedTitle, setFeedTitle] = useState(mediaContextDefaults.feedTitle);
  const [isMuted, setIsMuted] = useState<boolean>(mediaContextDefaults.isMuted);
  const [isPaused, setIsPaused] = useState<boolean>(
    mediaContextDefaults.isPaused,
  );
  const [isLoadingAtCurrentTime, setIsLoadingAtCurrentTime] = useState(false);
  const [isTranscriptVisibleAsSubtitle, setIsTranscriptVisibleAsSubtitle] =
    useState(mediaContextDefaults.isTranscriptVisibleAsSubtitle);
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1);
  const [src, setSrc] = useState<string | null>(mediaContextDefaults.src);
  const [srcType, setSrcType] = useState<string | null>(
    mediaContextDefaults.srcType,
  );
  const [size, setSize] = useState<1 | 2>(mediaContextDefaults.size);
  const [volume, setVolume] = useState<number>(mediaContextDefaults.volume);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data: chapters } = useQuery({
    enabled:
      typeof dateCrawled === 'number' &&
      typeof chaptersUrl === 'string' &&
      chaptersUrl.length > 0,
    queryFn: async () => await fetchPodcastEpisodeChapters(chaptersUrl),
    queryKey: ['chapters', chaptersUrl, dateCrawled],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

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
    isDoneHydratingFromIdb;

  const resetMediaContext = useCallback(() => {
    audioRef.current?.pause();
    videoRef.current?.pause();

    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }

    setChaptersUrl(mediaContextDefaults.chaptersUrl);
    setDateCrawled(mediaContextDefaults.dateCrawled);
    setDidError(mediaContextDefaults.didError);
    setEpisodeId(mediaContextDefaults.episodeId);
    setEpisodeImage(mediaContextDefaults.episodeImage);
    setEpisodeImageDimensions(mediaContextDefaults.episodeImageDimensions);
    setEpisodeTitle(mediaContextDefaults.episodeTitle);
    setFeedId(mediaContextDefaults.feedId);
    setFeedImage(mediaContextDefaults.feedImage);
    setFeedTitle(mediaContextDefaults.feedTitle);
    setIsLoadingAtCurrentTime(mediaContextDefaults.isLoadingAtCurrentTime);
    setIsMuted(mediaContextDefaults.isMuted);
    setIsPaused(mediaContextDefaults.isPaused);
    setPlaybackRate(mediaContextDefaults.playbackRate);
    setSize(mediaContextDefaults.size);
    setSrc(mediaContextDefaults.src);
    setSrcType(mediaContextDefaults.srcType);
    setVolume(mediaContextDefaults.volume);
  }, []);

  const seekBackward = useCallback(
    ({
      seekOffset = DEFAULT_SEEK_BACKWARD_OFFSET,
    }: Partial<MediaSessionActionDetails>) => {
      const resultTime =
        mediaPlayerCurrentTime - (seekOffset ?? DEFAULT_SEEK_BACKWARD_OFFSET);

      setCurrentTime(resultTime);
    },
    [mediaPlayerCurrentTime],
  );

  const seekForward = useCallback(
    ({
      seekOffset = DEFAULT_SEEK_FORWARD_OFFSET,
    }: Partial<MediaSessionActionDetails>) => {
      const resultTime =
        mediaPlayerCurrentTime + (seekOffset ?? DEFAULT_SEEK_FORWARD_OFFSET);

      setCurrentTime(resultTime);
    },
    [mediaPlayerCurrentTime],
  );

  const pause = useCallback(() => {
    setIsPaused(true);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (videoRef.current) {
      videoRef.current.pause();
    }

    // Ensure MediaSession state is updated
    if ('mediaSession' in window.navigator) {
      window.navigator.mediaSession.playbackState = 'paused';
    }
  }, []);

  const play = useCallback(async () => {
    setIsPaused(false);

    if (audioRef.current) {
      if (didError) {
        setDidError(false);
        audioRef.current.load();
      }

      try {
        await audioRef.current.play();

        // Ensure MediaSession state is updated after successful play
        if ('mediaSession' in window.navigator) {
          window.navigator.mediaSession.playbackState = 'playing';
        }
      } catch {
        setDidError(true);
        setIsPaused(true);

        return;
      }
    }

    if (videoRef.current) {
      if (didError) {
        setDidError(false);
        videoRef.current.load();
      }

      try {
        await videoRef.current.play();

        // Ensure MediaSession state is updated after successful play
        if ('mediaSession' in window.navigator) {
          window.navigator.mediaSession.playbackState = 'playing';
        }
      } catch {
        setDidError(true);
        setIsPaused(true);

        return;
      }
    }
  }, [didError]);

  const playPause = useCallback(async () => {
    const nextIsPaused = !isPaused;

    setIsPaused(nextIsPaused);

    if (audioRef.current) {
      if (nextIsPaused) {
        audioRef.current.pause();
      } else {
        if (didError) {
          setDidError(false);
          audioRef.current.load();
        }

        try {
          await audioRef.current.play();
        } catch {
          setDidError(true);
          setIsPaused(true);

          return;
        }
      }
    }

    if (videoRef.current) {
      if (nextIsPaused) {
        videoRef.current.pause();
      } else {
        if (didError) {
          setDidError(false);
          videoRef.current.load();
        }

        try {
          await videoRef.current.play();
        } catch {
          setDidError(true);
          setIsPaused(true);

          return;
        }
      }
    }

    window.navigator.mediaSession.playbackState = nextIsPaused
      ? 'paused'
      : 'playing';
  }, [didError, isPaused]);

  useEffect(() => {
    if (mediaPlayerSettings && !isDoneHydratingFromIdb) {
      idbHydrationPromise?.then(() => {
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
        setIsPaused(mediaPlayerSettings.isPaused);
        setIsMuted(mediaPlayerSettings.isMuted);
        setIsTranscriptVisibleAsSubtitle(
          mediaPlayerSettings.isTranscriptVisibleAsSubtitle,
        );
        setMediaPlayerCurrentTime(mediaPlayerSettings.currentTime);
        setPlaybackRate(
          mediaPlayerSettings.playbackRate ?? mediaContextDefaults.playbackRate,
        );
        setSize(mediaPlayerSettings.size ?? mediaContextDefaults.size);
        setSrc(mediaPlayerSettings.src);
        setSrcType(mediaPlayerSettings.srcType);
        setVolume(mediaPlayerSettings.volume);
      });
    }
  }, [
    idbHydrationPromise,
    isDoneHydratingFromIdb,
    mediaPlayerSettings,
    setCurrentTime,
    setMediaPlayerCurrentTime,
  ]);

  /**
   * Update the episode settings when the audio element's `currentTime`
   * property changes, but debounce `currentTime`. The debouncing causes the
   * settings to only be updated if the `currentTime` stops changing for 500ms,
   * but will never wait longer than 5 seconds to update the settings.
   */
  useEffect(() => {
    if (episodeId && isDoneHydratingFromIdb) {
      setEpisodeSettingsItem(`${episodeId}`, {
        currentTime: mediaPlayerCurrentTimeDebounced,
        duration,
      });
    }
  }, [
    duration,
    episodeId,
    isDoneHydratingFromIdb,
    mediaPlayerCurrentTimeDebounced,
    setEpisodeSettingsItem,
  ]);

  useEffect(() => {
    if (isDoneHydratingFromIdb) {
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
        isPaused,
        isTranscriptVisibleAsSubtitle,
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
    isDoneHydratingFromIdb,
    isFirstRenderAfterHydration,
    isTranscriptVisibleAsSubtitle,
    isMuted,
    isPaused,
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
    const setMediaSessionMetadata = () => {
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
        navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing';
      }
    };

    // Only set metadata if we have media content
    if (src || episodeId) {
      setMediaSessionMetadata();
    }
  }, [
    currentChapter?.img,
    currentChapter?.title,
    episodeImage,
    episodeTitle,
    feedImage,
    feedTitle,
    isPaused,
    src,
    episodeId,
  ]);

  /**
   * Set MediaSession action handlers.
   */
  useEffect(() => {
    const setMediaSessionHandlers = () => {
      if ('mediaSession' in window.navigator) {
        // Clear existing handlers first to ensure clean state
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('seekto', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);

        // Set new handlers
        navigator.mediaSession.setActionHandler('play', play);
        navigator.mediaSession.setActionHandler('pause', pause);
        navigator.mediaSession.setActionHandler('stop', pause);
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
    };

    // Set handlers initially
    setMediaSessionHandlers();

    // Re-set handlers when there's actual media content and the app becomes visible
    // This helps with lock screen widget functionality
    const handleVisibilityChange = () => {
      if (!document.hidden && (src || episodeId)) {
        // Small delay to ensure the app is fully active
        setTimeout(setMediaSessionHandlers, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pause, play, seekBackward, seekForward, src, episodeId]);

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

  /**
   * Update `isLoadingAtCurrentTime` whenever the buffered time ranges change,
   * either from the element's `progress` event, or from changes to the
   * element's `.buffered` property.
   */
  useEffect(() => {
    const elementBufferedTuples = bufferedTimeRangesToTuples(
      videoRef.current?.buffered ?? audioRef.current?.buffered,
    );

    const isCurrentTimeInTuple = ([begin, end]: [number, number]) => {
      return mediaPlayerCurrentTime >= begin && mediaPlayerCurrentTime <= end;
    };

    const isBufferedAtCurrentTime =
      elementBufferedTuples.some(isCurrentTimeInTuple) ||
      progressEventBufferedTuples.some(isCurrentTimeInTuple);

    if (!isBufferedAtCurrentTime && !isPaused) {
      setIsLoadingAtCurrentTime(true);
    } else {
      setIsLoadingAtCurrentTime(false);
    }
  }, [
    progressEventBufferedTuples,
    isPaused,
    mediaPlayerCurrentTime,
    audioRef.current?.buffered,
    videoRef.current?.buffered,
  ]);

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
        didError,
        duration,
        episodeId,
        episodeImage,
        episodeImageDimensions,
        episodeTitle,
        feedId,
        feedImage,
        feedTitle,
        isLoadingAtCurrentTime,
        isMuted,
        isPaused,
        isTranscriptVisibleAsSubtitle,
        mediaPlayerCurrentTime,
        mediaPlayerCurrentTimeDebounced,
        pause,
        play,
        playPause,
        playbackRate,
        progressEventBufferedTuples,
        resetMediaContext,
        seekBackward,
        seekForward,
        setChaptersUrl,
        setCurrentTime,
        setDateCrawled,
        setDidError,
        setDuration,
        setEpisodeId,
        setEpisodeImage,
        setEpisodeImageDimensions,
        setEpisodeTitle,
        setFeedId,
        setFeedImage,
        setFeedTitle,
        setIsMuted,
        setIsPaused,
        setIsTranscriptVisibleAsSubtitle,
        setMediaPlayerCurrentTime,
        setPlaybackRate,
        setProgressEventBufferedTuples,
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

export const useMediaContext = (): MediaContext =>
  useContext(MediaContext) || mediaContextDefaults;

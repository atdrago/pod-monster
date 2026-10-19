import { useQuery } from '@tanstack/react-query';
import {
  type FunctionComponent,
  type PropsWithChildren,
  type Dispatch,
  type RefObject,
  type SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { useSettingsContext } from 'contexts/SettingsContext';
import { useStateWithDebounce } from 'hooks/useStateWithDebounce';
import { fetchPodcastEpisodeChapters } from 'rest/fetchPodcastEpisodeChapters';
import type { Chapter } from 'types';
import { bufferedTimeRangesToTuples } from 'utils/bufferedTimeRangesToTuples';
import type { PlaybackRate } from 'utils/playbackRates';

interface MediaContext {
  audioRef: RefObject<HTMLAudioElement | null>;
  chapters: Array<Chapter> | null | undefined;
  chaptersUrl: string | null;
  currentChapter: Chapter | null;
  currentChapterIndex: number;
  currentTime: number;
  dateCrawled: number | null;
  didError: boolean;
  duration: number;
  episodeIdentity: string | null;
  episodeImage: string | null;
  episodeImageDimensions: { height: number; width: number } | null;
  episodeTitle: string | null;
  feedImage: string | null;
  feedTitle: string | null;
  feedUrl: string | null;
  isLoadingAtCurrentTime: boolean;
  isMuted: boolean;
  isPaused: boolean;
  isTranscriptVisibleAsSubtitle: boolean;
  mediaPlayerCurrentTime: number;
  mediaPlayerCurrentTimeDebounced: number;
  pause: () => void;
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
  setEpisodeIdentity: Dispatch<SetStateAction<string | null>>;
  setEpisodeImage: Dispatch<SetStateAction<string | null>>;
  setEpisodeImageDimensions: Dispatch<
    SetStateAction<{ height: number; width: number } | null>
  >;
  setEpisodeTitle: Dispatch<SetStateAction<string | null>>;
  setFeedImage: Dispatch<SetStateAction<string | null>>;
  setFeedTitle: Dispatch<SetStateAction<string | null>>;
  setFeedUrl: Dispatch<SetStateAction<string | null>>;
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
  videoRef: RefObject<HTMLVideoElement | null>;
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
  episodeIdentity: null,
  episodeImage: null,
  episodeImageDimensions: null,
  episodeTitle: null,
  feedImage: null,
  feedTitle: null,
  feedUrl: null,
  isLoadingAtCurrentTime: false,
  isMuted: false,
  isPaused: true,
  isTranscriptVisibleAsSubtitle: true,
  mediaPlayerCurrentTime: 0,
  mediaPlayerCurrentTimeDebounced: 0,
  pause: () => {},
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
  setEpisodeIdentity: (_) => {},
  setEpisodeImage: (_) => {},
  setEpisodeImageDimensions: (_) => {},
  setEpisodeTitle: (_) => {},
  setFeedImage: (_) => {},
  setFeedTitle: (_) => {},
  setFeedUrl: (_) => {},
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
    getEpisodeSettingsItem,
    hydratedMediaPlayerSettings,
    isDoneHydratingFromIdb,
    setEpisodeSettingsItem,
    setMediaPlayerSettings,
  } = useSettingsContext();

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
  const [episodeIdentity, setEpisodeIdentity] = useState(
    mediaContextDefaults.episodeIdentity,
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
  const [feedImage, setFeedImage] = useState(mediaContextDefaults.feedImage);
  const [feedTitle, setFeedTitle] = useState(mediaContextDefaults.feedTitle);
  const [feedUrl, setFeedUrl] = useState(mediaContextDefaults.feedUrl);
  const [isMuted, setIsMuted] = useState<boolean>(mediaContextDefaults.isMuted);
  const [isPaused, setIsPaused] = useState<boolean>(
    mediaContextDefaults.isPaused,
  );
  const [isTranscriptVisibleAsSubtitle, setIsTranscriptVisibleAsSubtitle] =
    useState(mediaContextDefaults.isTranscriptVisibleAsSubtitle);
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1);
  const [src, setSrc] = useState<string | null>(mediaContextDefaults.src);
  const [srcType, setSrcType] = useState<string | null>(
    mediaContextDefaults.srcType,
  );
  const [size, setSize] = useState<1 | 2>(mediaContextDefaults.size);
  const [volume, setVolume] = useState<number>(mediaContextDefaults.volume);

  const [isMediaStateHydrated, setIsMediaStateHydrated] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastPositionRef = useRef<{
    duration: number;
    episodeIdentity: string | null;
    feedUrl: string | null;
    time: number;
  } | null>(null);

  const setEpisodeSettingsItemDebounced = useDebouncedCallback(
    setEpisodeSettingsItem,
    500,
    { maxWait: 5000 },
  );

  /**
   * Hydrate the state one time, in the first render after the settings
   * hydrate. The saved position of the episode is the one source of its time.
   */
  if (isDoneHydratingFromIdb && !isMediaStateHydrated) {
    setIsMediaStateHydrated(true);

    if (hydratedMediaPlayerSettings !== undefined) {
      const hydratedCurrentTime =
        getEpisodeSettingsItem({
          episodeIdentity: hydratedMediaPlayerSettings.episodeIdentity,
          feedUrl: hydratedMediaPlayerSettings.feedUrl,
        })?.currentTime ?? 0;

      setChaptersUrl(hydratedMediaPlayerSettings.chaptersUrl);
      setCurrentTime(hydratedCurrentTime);
      setDateCrawled(hydratedMediaPlayerSettings.dateCrawled);
      setEpisodeIdentity(hydratedMediaPlayerSettings.episodeIdentity);
      setEpisodeImage(hydratedMediaPlayerSettings.episodeImage);
      setEpisodeImageDimensions(
        hydratedMediaPlayerSettings.episodeImageDimensions,
      );
      setEpisodeTitle(hydratedMediaPlayerSettings.episodeTitle);
      setFeedImage(hydratedMediaPlayerSettings.feedImage);
      setFeedTitle(hydratedMediaPlayerSettings.feedTitle);
      setFeedUrl(hydratedMediaPlayerSettings.feedUrl);
      setIsMuted(hydratedMediaPlayerSettings.isMuted);
      setIsPaused(hydratedMediaPlayerSettings.isPaused);
      setIsTranscriptVisibleAsSubtitle(
        hydratedMediaPlayerSettings.isTranscriptVisibleAsSubtitle,
      );
      setMediaPlayerCurrentTime(hydratedCurrentTime);
      setPlaybackRate(hydratedMediaPlayerSettings.playbackRate);
      setSize(hydratedMediaPlayerSettings.size);
      setSrc(hydratedMediaPlayerSettings.src);
      setSrcType(hydratedMediaPlayerSettings.srcType);
      setVolume(hydratedMediaPlayerSettings.volume);
    }
  }

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

  const resetMediaContext = useCallback(() => {
    audioRef.current?.pause();
    videoRef.current?.pause();

    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }

    setChaptersUrl(mediaContextDefaults.chaptersUrl);
    setDateCrawled(mediaContextDefaults.dateCrawled);
    setDidError(mediaContextDefaults.didError);
    setEpisodeIdentity(mediaContextDefaults.episodeIdentity);
    setEpisodeImage(mediaContextDefaults.episodeImage);
    setEpisodeImageDimensions(mediaContextDefaults.episodeImageDimensions);
    setEpisodeTitle(mediaContextDefaults.episodeTitle);
    setFeedImage(mediaContextDefaults.feedImage);
    setFeedTitle(mediaContextDefaults.feedTitle);
    setFeedUrl(mediaContextDefaults.feedUrl);
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

    window.navigator.mediaSession.playbackState = 'paused';
  }, []);

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

        await audioRef.current.play();
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

        await videoRef.current.play();
      }
    }

    window.navigator.mediaSession.playbackState = nextIsPaused
      ? 'paused'
      : 'playing';
  }, [didError, isPaused]);

  /**
   * Write the position of the episode when its time changes, after 500ms of
   * quiet or at most every 5 seconds. Each write carries the episode that was
   * in the player when the time changed. After a change of episode, the time
   * can still belong to the last episode until the media element reports
   * again. Thus, a change of episode only flushes the pending write of the
   * last episode.
   */
  useEffect(() => {
    if (!isMediaStateHydrated) {
      return;
    }

    const lastPosition = lastPositionRef.current;

    lastPositionRef.current = {
      duration,
      episodeIdentity,
      feedUrl,
      time: mediaPlayerCurrentTime,
    };

    if (lastPosition === null) {
      return;
    }

    if (
      lastPosition.episodeIdentity !== episodeIdentity ||
      lastPosition.feedUrl !== feedUrl
    ) {
      setEpisodeSettingsItemDebounced.flush();

      return;
    }

    const isSamePosition =
      lastPosition.time === mediaPlayerCurrentTime &&
      lastPosition.duration === duration;

    if (isSamePosition || episodeIdentity === null || feedUrl === null) {
      return;
    }

    setEpisodeSettingsItemDebounced(
      { episodeIdentity, feedUrl },
      { currentTime: mediaPlayerCurrentTime, duration },
    );
  }, [
    duration,
    episodeIdentity,
    feedUrl,
    isMediaStateHydrated,
    mediaPlayerCurrentTime,
    setEpisodeSettingsItemDebounced,
  ]);

  useEffect(() => {
    if (!isMediaStateHydrated) {
      return;
    }

    setMediaPlayerSettings({
      chaptersUrl,
      dateCrawled,
      episodeIdentity,
      episodeImage,
      episodeImageDimensions,
      episodeTitle,
      feedImage,
      feedTitle,
      feedUrl,
      isMuted,
      isPaused,
      isTranscriptVisibleAsSubtitle,
      playbackRate,
      size,
      src,
      srcType,
      volume,
    });
  }, [
    chaptersUrl,
    dateCrawled,
    episodeIdentity,
    episodeImage,
    episodeImageDimensions,
    episodeTitle,
    feedImage,
    feedTitle,
    feedUrl,
    isMediaStateHydrated,
    isMuted,
    isPaused,
    isTranscriptVisibleAsSubtitle,
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
      navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing';
    }
  }, [
    currentChapter?.img,
    currentChapter?.title,
    episodeImage,
    episodeTitle,
    feedImage,
    feedTitle,
    isPaused,
  ]);

  /**
   * Set MediaSession action handlers.
   */
  useEffect(() => {
    if ('mediaSession' in window.navigator) {
      navigator.mediaSession.setActionHandler('play', playPause);
      navigator.mediaSession.setActionHandler('pause', playPause);
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
  }, [pause, playPause, seekBackward, seekForward]);

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

  const bufferedTimeRanges =
    // eslint-disable-next-line react-hooks/refs
    audioRef.current?.buffered || videoRef.current?.buffered;

  /**
   * Update `isLoadingAtCurrentTime` whenever the buffered time ranges change,
   * either from the element's `progress` event, or from changes to the
   * element's `.buffered` property.
   */
  const isLoadingAtCurrentTime = useMemo(() => {
    const elementBufferedTuples = bufferedTimeRangesToTuples(
      // eslint-disable-next-line react-hooks/refs
      bufferedTimeRanges,
    );

    const isCurrentTimeInTuple = ([begin, end]: [number, number]) => {
      return mediaPlayerCurrentTime >= begin && mediaPlayerCurrentTime <= end;
    };

    const isBufferedAtCurrentTime =
      elementBufferedTuples.some(isCurrentTimeInTuple) ||
      progressEventBufferedTuples.some(isCurrentTimeInTuple);

    return !isBufferedAtCurrentTime && !isPaused;
  }, [
    progressEventBufferedTuples,
    isPaused,
    mediaPlayerCurrentTime,
    bufferedTimeRanges,
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
        episodeIdentity,
        episodeImage,
        episodeImageDimensions,
        episodeTitle,
        feedImage,
        feedTitle,
        feedUrl,
        isLoadingAtCurrentTime,
        isMuted,
        isPaused,
        isTranscriptVisibleAsSubtitle,
        mediaPlayerCurrentTime,
        mediaPlayerCurrentTimeDebounced,
        pause,
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
        setEpisodeIdentity,
        setEpisodeImage,
        setEpisodeImageDimensions,
        setEpisodeTitle,
        setFeedImage,
        setFeedTitle,
        setFeedUrl,
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

import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import type { Chapter, PlaybackRate } from 'types';

export interface MediaContext {
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

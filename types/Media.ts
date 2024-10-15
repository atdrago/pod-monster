import type { MutableRefObject } from 'react';

import { playbackRates } from 'utils/playbackRates';

export type PlaybackRate = (typeof playbackRates)[number];

export type MediaProps = JSX.IntrinsicElements['audio'] &
  Pick<JSX.IntrinsicElements['video'], 'poster'> & {
    audioRef: MutableRefObject<HTMLAudioElement | null>;
    currentTime?: number;
    isTitleVisible?: boolean;
    isVideoVisible?: boolean;
    onCurrentTimeChange?: (currentTime: number) => void;
    playbackRate?: PlaybackRate;
    srcType?: string;
    startTime?: number;
    title?: string;
    videoRef: MutableRefObject<HTMLVideoElement | null>;
  };

import type { MutableRefObject } from 'react';

export type MediaProps = JSX.IntrinsicElements['audio'] &
  Pick<JSX.IntrinsicElements['video'], 'poster'> & {
    audioRef: MutableRefObject<HTMLAudioElement | null>;
    currentTime?: number;
    isTitleVisible?: boolean;
    isVideoVisible?: boolean;
    onCurrentTimeChange?: (currentTime: number) => void;
    srcType?: string;
    startTime?: number;
    title?: string;
    videoRef: MutableRefObject<HTMLVideoElement | null>;
  };

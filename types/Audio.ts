import type { MutableRefObject } from 'react';

export type AudioProps = JSX.IntrinsicElements['audio'] & {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  currentTime?: number;
  isTitleVisible?: boolean;
  isVideoVisible?: boolean;
  onCurrentTimeChange?: (currentTime: number) => void;
  poster?: string;
  srcType?: string;
  startTime?: number;
  title?: string;
  videoRef: MutableRefObject<HTMLVideoElement | null>;
};

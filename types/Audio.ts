import type { MutableRefObject } from 'react';

export type AudioProps = JSX.IntrinsicElements['audio'] & {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  currentTime?: number;
  isTitleVisible?: boolean;
  onCurrentTimeChange?: (currentTime: number) => void;
  startTime?: number;
  title?: string;
};

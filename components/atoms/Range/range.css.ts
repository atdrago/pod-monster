import { style, styleVariants } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from 'styles';

const AUDIO_TRACK_HEIGHT = vars.spacing.s032;
const VOLUME_TRACK_HEIGHT = vars.spacing.s002;
const VOLUME_THUMB_HEIGHT = vars.spacing.s016;

export const range = style({
  WebkitAppearance: 'none',
  background: 'none',
  margin: '0',
  width: '100%',
});

const audioThumbStyles = {
  background: vars.color.foreground,
  border: 0,
  borderRadius: '0',
  boxShadow: 'none',
  cursor: 'pointer',
  height: '100%',
  width: vars.spacing.s024,
};

const audioTrackFillStyles = {
  background: vars.color.background,
  border: `2px solid ${vars.color.foreground}`,
  borderRadius: '0',
  boxShadow: 'none',
};

const audioTrackStyles = (height: string) => ({
  ...audioTrackFillStyles,
  cursor: 'pointer',
  height,
  width: '100%',
});

const volumeThumbStyles = {
  background: vars.color.foreground,
  borderRadius: '100%',
  boxShadow: 'none',
  cursor: 'pointer',
  height: VOLUME_THUMB_HEIGHT,
  marginTop: calc(VOLUME_THUMB_HEIGHT)
    .divide(2)
    .subtract(calc(VOLUME_TRACK_HEIGHT).divide(2))
    .negate()
    .toString(),
  width: VOLUME_THUMB_HEIGHT,
};

const volumeTrackFillStyles = {
  background: vars.color.foreground,
  border: '0',
  borderRadius: '0',
  boxShadow: 'none',
};

const volumeTrackStyles = (height: string) => ({
  ...volumeTrackFillStyles,
  cursor: 'pointer',
  height,
  width: '100%',
});

export const rangeVariant = styleVariants({
  audio: {
    selectors: {
      '&::-moz-range-thumb': audioThumbStyles,
      '&::-moz-range-track': audioTrackStyles(AUDIO_TRACK_HEIGHT),
      '&::-ms-fill-lower': audioTrackFillStyles,
      '&::-ms-fill-upper': audioTrackFillStyles,
      '&::-ms-thumb': {
        ...audioThumbStyles,
        marginTop: '1px',
      },
      '&::-ms-track': {
        background: 'transparent',
        borderColor: 'transparent',
        color: 'transparent',
        cursor: 'pointer',
        height: AUDIO_TRACK_HEIGHT,
        width: '100%',
      },
      '&::-webkit-slider-runnable-track': audioTrackStyles(AUDIO_TRACK_HEIGHT),
      '&::-webkit-slider-thumb': {
        ...audioThumbStyles,
        WebkitAppearance: 'none',
      },
    },
  },
  volume: {
    selectors: {
      '&::-moz-range-thumb': volumeThumbStyles,
      '&::-moz-range-track': volumeTrackStyles(VOLUME_TRACK_HEIGHT),
      '&::-ms-fill-lower': volumeTrackFillStyles,
      '&::-ms-fill-upper': volumeTrackFillStyles,
      '&::-ms-thumb': {
        ...volumeThumbStyles,
        marginTop: '1px',
      },
      '&::-ms-track': {
        background: 'transparent',
        borderColor: 'transparent',
        color: 'transparent',
        cursor: 'pointer',
        height: VOLUME_TRACK_HEIGHT,
        width: '100%',
      },
      '&::-webkit-slider-runnable-track':
        volumeTrackStyles(VOLUME_TRACK_HEIGHT),
      '&::-webkit-slider-thumb': {
        ...volumeThumbStyles,
        WebkitAppearance: 'none',
      },
    },
  },
});

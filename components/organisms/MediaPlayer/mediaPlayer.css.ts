import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from 'styles';

export const player = style({
  '@supports': {
    '(backdrop-filter: blur(6px))': {
      backdropFilter: 'blur(6px)',
      backgroundColor: vars.color.backgroundBlurred,
    },
  },
  backdropFilter: 'blur(6px)',
  backgroundColor: vars.color.backgroundBlurredOpaque,
  border: '0.5px solid rgba(255, 255, 255, 0.3)',
  overflow: 'hidden',
  padding: `${vars.spacing.s016}`,
  transition: '500ms ease box-shadow, 500ms ease transform',
});

export const playerElevatedVariant = styleVariants({
  elevated: {
    boxShadow: vars.color.shadowElevationHigh,
  },
  inset: {
    boxShadow: vars.color.shadowElevationMedium,
  },
});

export const playerButtons = style({
  alignItems: 'center',
  display: 'grid',
  gridTemplateColumns: '30px 1fr 155px 1fr 18px',
});

const VOLUME_ICON_BUTTON_WIDTH = '30px';

export const volumeLayout = style({
  alignItems: 'center',
  display: 'flex',
  margin: 'auto',
  // This paddingRight offsets the volume icon on the left
  paddingRight: VOLUME_ICON_BUTTON_WIDTH,
  width: '280px',
});

export const iconButton = style({
  alignItems: 'center',
  background: 'none',
  border: '0',
  color: vars.color.foreground,
  cursor: 'pointer',
  display: 'inline-flex',
  margin: '0',
  padding: `${vars.spacing.s004} ${vars.spacing.s008}`,
  width: VOLUME_ICON_BUTTON_WIDTH,
});

export const playbackRateContainer = style({
  margin: `0 ${vars.spacing.s004}`,
});

export const intersectionObserverClassName = style({
  bottom: -17,
  height: '0',
  position: 'absolute',
});

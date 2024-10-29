import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from 'styles';
import {
  stack,
  spaceVariant,
  kindVariant,
} from 'components/layouts/Stack/stack.css';

export const container = style({
  '@supports': {
    '(backdrop-filter: blur(6px))': {
      backdropFilter: 'blur(6px)',
      background: vars.color.backgroundBlurred,
    },
  },
  background: vars.color.backgroundBlurredOpaque,
  bottom: 0,
});

export const containerPinnedVariant = styleVariants({
  pinned: {
    '@media': {
      'screen and (min-width: 512px)': {
        width: '480px',
      },
    },
    maxWidth: '512px',
    width: '100vw',
  },
  unpinned: {
    maxWidth: '480px',
    width: '100vw',
  },
});

export const player = style([
  stack,
  kindVariant['flex'],
  spaceVariant['small'],
  {
    overflow: 'hidden',
    padding: `${vars.spacing.s016}`,
    transition: '500ms ease box-shadow, 500ms ease transform',
  },
]);

export const playerPinnedVariant = styleVariants({
  pinned: {
    // '@media': {
    //   'screen and (display-mode: standalone) and (max-width: 512px)': {
    //     padding: `${vars.spacing.s016} ${vars.spacing.s016} ${vars.spacing.s032}`,
    //   },
    // },
  },
  unpinned: {},
});

export const playerElevatedVariant = styleVariants({
  elevated: {
    boxShadow: vars.color.shadowElevationHigh,
  },
  inset: {
    boxShadow: vars.color.shadowElevationLow,
  },
});

export const playerButtons = style({
  width: '100%',
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
  flex: '0 0 auto',
  marginLeft: `auto`,
  whiteSpace: 'nowrap',
  width: 22,
});

export const intersectionObserverClassName = style({
  bottom: -17,
  height: '0',
  position: 'absolute',
});

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
});

export const containerPinnedVariant = styleVariants({
  pinned: {
    '@media': {
      'screen and (min-width: 512px)': {
        bottom: 16,
        marginLeft: 0,
        width: '480px',
      },
    },
    bottom: 0,
    maxWidth: '512px',
    width: '100vw',
  },
  unpinned: {
    bottom: 16,
    marginLeft: 0,
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
    '@media': {
      'screen and (display-mode: standalone) and (max-width: 512px)': {
        padding: `${vars.spacing.s032} ${vars.spacing.s016}`,
      },
    },
  },
  unpinned: {},
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
  marginLeft: `auto`,
  whiteSpace: 'nowrap',
});

export const intersectionObserverClassName = style({
  bottom: -17,
  height: '0',
  position: 'absolute',
});

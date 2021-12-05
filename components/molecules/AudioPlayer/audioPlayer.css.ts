import { style, styleVariants } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from 'styles';

export const player = style({
  backdropFilter: 'blur(6px)',
  backgroundColor: vars.color.backgroundBlurred,
  padding: `${vars.spacing.s016}`,
  transition: '500ms ease box-shadow, 500ms ease transform',
});

export const playerElevatedVariant = styleVariants({
  elevated: {
    boxShadow: vars.color.shadowElevationHigh,
    transform: `translate(0, ${calc(vars.spacing.s016).negate().toString()})`,
  },
  inset: {
    boxShadow: vars.color.shadowElevationMedium,
    transform: `translate(0, 0)`,
  },
});

export const playerButtons = style({
  alignItems: 'center',
  display: 'grid',
  gridTemplateColumns: '30px 1fr 30px',
});

export const playerTitleClassName = style({
  gridColumnStart: '2',
});

export const playerMinimize = style({
  gridColumnStart: '3',
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

export const intersectionObserverClassName = style({
  bottom: -1,
  height: '0',
  position: 'absolute',
});

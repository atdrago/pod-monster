import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const player = style({
  backdropFilter: 'blur(6px)',
  backgroundColor: vars.color.backgroundBlurred,
  boxShadow: vars.color.shadowElevationMedium,
  margin: `${vars.spacing.s016} 0`,
  padding: `${vars.spacing.s016}`,
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

import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const audio = style({ display: 'none', width: '100%' });

export const mediaBase = style({ position: 'relative' });

export const labelLayout = style({
  alignItems: 'center',
  bottom: '0',
  display: 'grid',
  gap: vars.spacing.s008,
  gridTemplateColumns: 'max-content 1fr max-content',
  justifyContent: 'space-between',
  left: '0',
  margin: 'auto',
  padding: `0 ${vars.spacing.s008}`,
  pointerEvents: 'none',
  position: 'absolute',
  right: '0',
  top: '0',
});

const timeLabel = style({
  alignItems: 'center',
  // Because of `mix-blend-mode: difference`, this color must be white for both
  // dark and light mode users.
  color: '#fff',
  fontVariantNumeric: 'tabular-nums',
  mixBlendMode: 'difference',
  paddingTop: vars.spacing.s002,
});

const timeLabelLeftAndRight = style({
  letterSpacing: '-0.05rem',
});

export const timeLabelLeft = style([timeLabel, timeLabelLeftAndRight]);

export const timeLabelCenter = style([
  timeLabel,
  {
    paddingTop: 0,
    textAlign: 'center',
  },
]);

export const timeLabelRight = style([
  timeLabel,
  timeLabelLeftAndRight,
  {
    gridColumnStart: '3',
    textAlign: 'right',
  },
]);

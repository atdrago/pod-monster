import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const audio = style({ display: 'none', width: '100%' });

export const mediaBase = style({
  // TODO: The range input sits on a text line. This 10px text size keeps the
  // legacy height of that line. Remove it in a unit that names the image
  // change.
  fontSize: '10px',
  position: 'relative',
});

export const labelLayout = style({
  alignItems: 'center',
  bottom: '0',
  display: 'grid',
  gap: vars.spacing.s016,
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

export const timeLabel = style({
  alignItems: 'center',
  // Because of `mix-blend-mode: difference`, this color must be white for both
  // dark and light mode users.
  color: '#fff',
  fontVariantNumeric: 'tabular-nums',
  mixBlendMode: 'difference',
});

export const timeLabelCenter = style([
  timeLabel,
  {
    textAlign: 'center',
  },
]);

export const timeLabelRight = style([
  timeLabel,
  {
    gridColumnStart: '3',
    textAlign: 'right',
  },
]);

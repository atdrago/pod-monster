import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const nav = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.spacing.s024,
  justifyContent: 'center',
});

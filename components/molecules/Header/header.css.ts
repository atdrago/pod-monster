import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const headerBaseClassName = style({
  alignItems: 'center',
  display: 'flex',
  gap: vars.spacing.s016,
  justifyContent: 'flex-start',
  margin: '-5px auto -6px',
  maxWidth: '100%',
});

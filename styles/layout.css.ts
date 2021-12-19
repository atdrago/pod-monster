import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const listLayout = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.s032,
  paddingLeft: vars.spacing.s024,
});

import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const htmlViewerContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.s032,
});

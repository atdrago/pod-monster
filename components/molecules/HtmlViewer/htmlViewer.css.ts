import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const htmlViewerContainer = style({});

export const imgClassName = style({
  height: 'auto',
  maxWidth: '100%',
});

export const listLayout = style({
  margin: 'auto',
  maxWidth: '48rem',
  paddingLeft: vars.spacing.s024,
  width: '100%',
});

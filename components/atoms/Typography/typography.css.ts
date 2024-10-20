import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const lineClampContainer = style({
  WebkitBoxOrient: 'vertical',
  background: 'none',
  border: 0,
  color: vars.color.foreground,
  display: '-webkit-box',
  overflow: 'hidden',
  wordBreak: 'break-word',
});

export const ellipsisContainer = style({
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

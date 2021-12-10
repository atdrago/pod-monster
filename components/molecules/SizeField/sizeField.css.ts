import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const buttonClassName = style({
  alignItems: 'stretch',
  background: 'none',
  border: `2px solid ${vars.color.foreground}`,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  height: vars.spacing.s024,
  justifyContent: 'flex-end',
  justifySelf: 'flex-end',
  margin: 0,
  padding: 1,
  width: vars.spacing.s016,
});

export const inputClassName = style({
  display: 'none',
});

export const meterClassName = style({
  background: vars.color.foreground,
  content: '""',
  display: 'block',
  margin: 0,
  padding: 0,
});

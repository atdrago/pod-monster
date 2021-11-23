import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const label = style({
  alignItems: 'center',
  border: '0',
  color: vars.color.foreground,
  cursor: 'pointer',
});

export const input = style({
  display: 'none',
});

export const checkbox = style({
  background: vars.color.background,
  border: `2px solid ${vars.color.foreground}`,
  display: 'inline-block',
  height: '12px',
  lineHeight: '0px',
  width: '12px',
});

export const checkboxChecked = style([
  checkbox,
  {
    background: vars.color.foreground,
    border: '0',
  },
]);

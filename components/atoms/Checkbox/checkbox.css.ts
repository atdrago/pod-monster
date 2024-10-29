import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const label = style({
  cursor: 'pointer',
  flex: '1 0 auto',
});

export const input = style({
  display: 'none',
});

export const checkbox = style({
  background: vars.color.background,
  border: `2px solid ${vars.color.foreground}`,
  display: 'inline-block',
  flex: '0 0 auto',
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

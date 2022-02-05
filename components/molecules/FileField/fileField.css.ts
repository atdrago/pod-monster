import { style } from '@vanilla-extract/css';

import { spinnerClassName, vars } from 'styles';

export const buttonClassName = style({
  display: 'inline-block',
});

export const inputClassName = style({
  display: 'none',
});

export const iconClassName = style({
  height: vars.spacing.s016,
  width: vars.spacing.s016,
});

export const fileSpinnerClassName = style([iconClassName, spinnerClassName]);

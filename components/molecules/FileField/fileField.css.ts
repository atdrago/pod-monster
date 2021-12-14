import { keyframes, style } from '@vanilla-extract/css';

import { vars } from 'styles';

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

const spinnerAnimation = keyframes({
  '0%': {
    transform: 'rotate(0deg)',
  },
  '100%': {
    transform: 'rotate(359deg)',
  },
});

export const spinnerClassName = style([
  iconClassName,
  {
    animation: `1s infinite ${spinnerAnimation} linear`,
    transformOrigin: 'center',
  },
]);

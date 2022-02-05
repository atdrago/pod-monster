import { keyframes, style } from '@vanilla-extract/css';

export const spinnerAnimation = keyframes({
  '0%': {
    transform: 'rotate(0deg)',
  },
  '100%': {
    transform: 'rotate(359deg)',
  },
});

export const spinnerClassName = style({
  animation: `1s infinite ${spinnerAnimation} linear`,
  transformOrigin: 'center',
});

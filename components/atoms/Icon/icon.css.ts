import { style, styleVariants } from '@vanilla-extract/css';

import { spinnerAnimation } from 'styles';

export const icon = style({
  alignItems: 'center',
  display: 'inline-flex',
  lineHeight: 1,
});

export const iconSizeVariant = styleVariants({
  large: {
    fontSize: '36px',
    minHeight: '36px',
    minWidth: '36px',
  },
  medium: {
    fontSize: '22px',
    minHeight: '22px',
    minWidth: '22px',
  },
  small: {
    fontSize: '16px',
    minHeight: '16px',
    minWidth: '16px',
  },
  xsmall: {
    fontSize: '12px',
    minHeight: '12px',
    minWidth: '12px',
  },
  xxsmall: {
    fontSize: '8px',
    minHeight: '8px',
    minWidth: '8px',
  },
});

export const iconOrientationVariant = styleVariants({
  default: {},
  reverse: {
    transform: 'scaleX(-1)',
  },
  rotate90: {
    transform: 'rotate(90deg)',
  },
  spinning: {
    animation: `1s infinite ${spinnerAnimation} linear`,
    transformOrigin: 'center',
  },
});

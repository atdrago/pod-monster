import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from 'styles';

export const iconButton = style({
  alignItems: 'center',
  border: '0',
  color: vars.color.foreground,
  cursor: 'pointer',
  display: 'inline-flex',
  justifyContent: 'center',
  margin: '0',
  padding: '0',
});

export const backgroundVariant = styleVariants({
  circle: {
    background: vars.color.background,
    border: `3px solid ${vars.color.foreground}`,
    borderRadius: '100%',
    padding: `${vars.spacing.s016}`,
    textAlign: 'center',
  },
  default: {
    background: 'none',
  },
});

export const sizeVariant = styleVariants({
  large: {
    height: '75px',
    width: '75px',
  },
  medium: {
    height: '50px',
    width: '50px',
  },
  small: {
    height: '30px',
    width: '30px',
  },
});

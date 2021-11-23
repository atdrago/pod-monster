import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from 'styles';

export const artwork = style({
  alignSelf: 'center',
  maxHeight: '100%',
  position: 'absolute',
});

export const sizeVariant = styleVariants({
  full: {
    height: 'auto',
    objectFit: 'contain',
    width: '100%',
  },
  medium: {
    height: '10rem',
    width: '10rem',
  },
  small: {
    height: '5rem',
    width: '5rem',
  },
});

export const square = style({
  background: vars.color.backgroundBlurred,
  display: 'grid',
  gridArea: '1 / 1',
  height: '0',
  overflow: 'hidden',
  paddingTop: '100%',
  position: 'relative',
  width: '100%',
});

export const squareInner = style({
  display: 'flex',
  justifyContent: 'center',
  marginTop: '-100%',
  width: '100%',
});

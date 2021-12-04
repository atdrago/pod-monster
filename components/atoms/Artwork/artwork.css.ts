import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from 'styles';

export const artwork = style({
  alignSelf: 'center',
  maxHeight: '100%',
  position: 'absolute',
});

export const artworkFallback = style([
  artwork,
  {
    alignItems: 'center',
    background: vars.color.backgroundBlurred,
    display: 'flex',
    flex: '0 0 auto',
    justifyContent: 'center',
    padding: vars.spacing.s016,
    whiteSpace: 'nowrap',
  },
]);

export const shadowVariant = styleVariants({
  high: {
    boxShadow: vars.color.shadowElevationHigh,
  },
  low: {
    boxShadow: vars.color.shadowElevationLow,
  },
  medium: {
    boxShadow: vars.color.shadowElevationMedium,
  },
  none: {},
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
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  marginTop: '-100%',
  textAlign: 'center',
  width: '100%',
});

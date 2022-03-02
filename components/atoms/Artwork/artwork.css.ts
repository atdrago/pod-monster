import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from 'styles';

export const artwork = style({
  alignSelf: 'center',
  height: 'auto',
  maxHeight: '100%',
  objectFit: 'contain',
  position: 'absolute',
  width: '100%',
});

export const artworkFallback = style([
  artwork,
  {
    alignItems: 'center',
    display: 'flex',
    flex: '0 0 auto',
    justifyContent: 'center',
    padding: vars.spacing.s016,
    whiteSpace: 'nowrap',
  },
]);

export const shadowContainer = style({
  flex: '0 0 auto',
  lineHeight: 0,
  maxWidth: '100%',
  position: 'relative',
});

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

export const subtitleContainer = style({
  background: vars.color.backgroundSubtitles,
  bottom: 0,
  left: 0,
  margin: vars.spacing.s016,
  padding: vars.spacing.s016,
  position: 'absolute',
  right: 0,
});

import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from 'styles';

export const stack = style({
  alignItems: 'stretch',
  background: 'none',
  border: '0',
  margin: '0 auto',
  width: '100%',
});

export const spaceVariant = styleVariants({
  large: { gap: vars.spacing.s048 },
  medium: { gap: vars.spacing.s032 },
  none: { gap: '0' },
  small: { gap: vars.spacing.s016 },
  xlarge: { gap: vars.spacing.s064 },
  xsmall: { gap: vars.spacing.s008 },
  xxsmall: { gap: vars.spacing.s004 },
});

export const maxWidthVariant = styleVariants({
  none: { maxWidth: 'none' },
  small: { maxWidth: '48rem' },
});

export const kindVariant = styleVariants({
  flex: {
    display: 'flex',
    flexDirection: 'column',
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  flexRowReverse: {
    display: 'flex',
    flexDirection: 'row-reverse',
  },
  grid: {
    display: 'grid',
  },
});

export const alignVariant = styleVariants({
  center: {
    alignItems: 'center',
  },
  end: {
    alignItems: 'flex-end',
  },
  start: {
    alignItems: 'flex-start',
  },
});

export const justifyVariant = styleVariants({
  center: {
    justifyContent: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
});

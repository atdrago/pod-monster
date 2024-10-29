import { style, styleVariants } from '@vanilla-extract/css';
import capsize from 'capsize';

import { vars } from 'styles';
import { getFontMetricsFromUserAgent } from 'utils/typography';

export const button = style({
  border: 0,
  borderRadius: '4px',
  boxShadow: vars.color.shadowElevationLow,
  cursor: 'pointer',
  fontSize: vars.typography.fontSize.s18,
  margin: 0,
  padding: vars.spacing.s012,
});

export const buttonVariant = styleVariants({
  default: {
    background: vars.color.background,
    color: vars.color.foreground,
  },
  primary: {
    background: vars.color.backgroundHighlight,
    color: vars.color.foreground,
  },
});

export const sizeVariant = styleVariants({
  medium: {
    ...capsize({
      fontMetrics: getFontMetricsFromUserAgent(),
      fontSize: 16,
      lineGap: 16,
    }),
    fontSize: vars.typography.fontSize.s16,
    padding: vars.spacing.s012,
  },
  small: {
    ...capsize({
      fontMetrics: getFontMetricsFromUserAgent(),
      fontSize: 12,
      lineGap: 12,
    }),
    fontSize: vars.typography.fontSize.s12,
    padding: vars.spacing.s008,
  },
});

import { style, styleVariants } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';
import capsize from 'capsize';

import { vars } from 'styles';
import { getFontMetricsFromUserAgent } from 'utils/typography';

export const button = style({
  border: `1px solid ${vars.color.buttonBorder}`,
  borderRadius: '4px',
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

export const edgeVariant = styleVariants({
  mediumOverflow: {
    margin: `${calc(vars.spacing.s012).negate().toString()} 0 `,
  },
  normal: {
    margin: 0,
  },
  smallOverflow: {
    margin: `${calc(vars.spacing.s008).negate().toString()} 0 `,
  },
});

export const buttonGroup = style({
  alignItems: 'center',
  display: 'flex',
  gap: vars.spacing.s016,
  justifyContent: 'flex-end',
  margin: 'auto',
  maxWidth: '48rem',
  width: '100%',
});

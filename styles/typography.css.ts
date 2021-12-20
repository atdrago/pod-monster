import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const headingLink = style({
  color: vars.color.foreground,
  selectors: {
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  textDecoration: 'none',
});

export const nonUnderlinedLink = style({
  color: vars.color.foreground,
  textDecoration: 'none',
});

export const underlinedLink = style({
  color: vars.color.foreground,
  textDecoration: 'underline',
});

export const listItem = style({
  color: vars.color.foreground,
  fontSize: vars.typography.fontSize.s16,
  /**
   * `lineHeight` and `margin` are manually added from what capsize outputs for:
   * ```ts
   * ...capsize({
   *   fontMetrics: getFontMetricsFromUserAgent(),
   *   fontSize: 16,
   *   lineGap: 16,
   * })
   * ```
   */
  lineHeight: 1.5,
  margin: '-0.3765em 0 -0.4155em',
  wordWrap: 'break-word',
});

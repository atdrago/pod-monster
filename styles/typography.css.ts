import { style } from '@vanilla-extract/css';
import capsize from 'capsize';

import { vars } from 'styles';
import { getFontMetricsFromUserAgent } from 'utils/typography';

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

export const navLink = style({
  ...capsize({
    fontMetrics: getFontMetricsFromUserAgent(),
    fontSize: 18,
    lineGap: 18,
  }),
  background: 'none',
  border: 0,
  color: vars.color.foreground,
  cursor: 'pointer',
  fontSize: vars.typography.fontSize.s18,
  padding: 0,
  textDecoration: 'underline',
});

export const navLinkButtonText = style({
  position: 'relative',
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

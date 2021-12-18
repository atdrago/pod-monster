import { StyleRule, style, styleVariants } from '@vanilla-extract/css';
import capsize from 'capsize';

import { vars } from 'styles';
import { removeNullAndUndefined } from 'utils/removeNullAndUndefined';
import { getFontMetricsFromUserAgent } from 'utils/typography';

export const typography = style({
  color: vars.color.foreground,
  margin: '0 auto',
  maxWidth: '48rem',
  width: '100%',
  wordBreak: 'break-word',
});

export const blockquote = style({
  borderLeft: `2px solid ${vars.color.blockquoteBorder}`,
  margin: 'auto',
  maxWidth: '48rem',
  padding: `${vars.spacing.s016} 0 ${vars.spacing.s016} ${vars.spacing.s016}`,
  width: '100%',
});

export const ellipsisContainer = style({
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

function removeBeforeAndAfter<TInput = unknown>(css: TInput): TInput {
  return removeNullAndUndefined({
    ...css,
    '::after': undefined,
    '::before': undefined,
  });
}

const EIGHTEEN_AND_UNDER_LEADING = 1.5;
const OVER_EIGHTEEN_LEADING = 1.2;

const sizeVariantStyles: Record<string | number, StyleRule> = {
  headingLarge: {
    ...capsize({
      fontMetrics: getFontMetricsFromUserAgent(),
      fontSize: 28,
      leading: 28 * OVER_EIGHTEEN_LEADING,
    }),
    fontSize: vars.typography.fontSize.s28,
  },
  headingMedium: {
    ...capsize({
      fontMetrics: getFontMetricsFromUserAgent(),
      fontSize: 24,
      leading: 24 * OVER_EIGHTEEN_LEADING,
    }),
    fontSize: vars.typography.fontSize.s24,
  },
  headingSmall: {
    ...capsize({
      fontMetrics: getFontMetricsFromUserAgent(),
      fontSize: 20,
      leading: 20 * OVER_EIGHTEEN_LEADING,
    }),
    fontSize: vars.typography.fontSize.s20,
  },
  headingSmaller: {
    ...capsize({
      fontMetrics: getFontMetricsFromUserAgent(),
      fontSize: 18,
      leading: 18 * EIGHTEEN_AND_UNDER_LEADING,
    }),
    fontSize: vars.typography.fontSize.s18,
  },
  legal: {
    ...capsize({
      fontMetrics: getFontMetricsFromUserAgent(),
      fontSize: 12,
      leading: 12 * EIGHTEEN_AND_UNDER_LEADING,
    }),
    fontSize: vars.typography.fontSize.s12,
  },
  monospace: {
    color: vars.color.foreground,
    fontSize: vars.typography.fontSize.s12,
    lineHeight: '1.3',
    maxWidth: 'none',
  },
  paragraph: {
    ...capsize({
      fontMetrics: getFontMetricsFromUserAgent(),
      fontSize: 16,
      leading: 16 * EIGHTEEN_AND_UNDER_LEADING,
    }),
    fontSize: vars.typography.fontSize.s16,
    selectors: {
      [`${blockquote} &`]: {
        color: vars.color.blockquote,
      },
    },
  },
};

export const sizeVariant = styleVariants({
  headingLarge: sizeVariantStyles.headingLarge,
  headingMedium: sizeVariantStyles.headingMedium,
  headingSmall: sizeVariantStyles.headingSmall,
  headingSmaller: sizeVariantStyles.headingSmaller,
  legal: sizeVariantStyles.legal,
  monospace: sizeVariantStyles.monospace,
  paragraph: sizeVariantStyles.paragraph,
});

export const sizeVariantNoCapsize = styleVariants({
  headingLarge: removeBeforeAndAfter(sizeVariantStyles.headingLarge),
  headingMedium: removeBeforeAndAfter(sizeVariantStyles.headingMedium),
  headingSmall: removeBeforeAndAfter(sizeVariantStyles.headingSmall),
  headingSmaller: removeBeforeAndAfter(sizeVariantStyles.headingSmaller),
  legal: removeBeforeAndAfter(sizeVariantStyles.legal),
  monospace: removeBeforeAndAfter(sizeVariantStyles.monospace),
  paragraph: removeBeforeAndAfter(sizeVariantStyles.paragraph),
});

export const textAlignVariant = styleVariants({
  center: { textAlign: 'center' },
  left: { textAlign: 'left' },
});

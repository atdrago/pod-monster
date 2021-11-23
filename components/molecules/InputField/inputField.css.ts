import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const inputField = style({
  background: vars.color.background,
  border: `1px solid ${vars.color.buttonBorder}`,
  color: vars.color.foreground,
  fontSize: vars.typography.fontSize.s16,
  padding: vars.spacing.s008,
  selectors: {
    '&::-webkit-calendar-picker-indicator': {
      filter: vars.color.colorSchemeFilter,
    },
    '&::-webkit-search-results-button': {
      display: 'none',
    },
  },
  width: '100%',
});

export const inputLabel = style({
  position: 'relative',
});

export const inputFeedback = style({
  position: 'absolute',
  right: 0,
});

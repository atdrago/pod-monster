import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const inputField = style({
  background: vars.color.background,
  border: `2px solid ${vars.color.buttonBorder}`,
  borderRadius: 0,
  color: vars.color.foreground,
  fontSize: vars.typography.fontSize.s16,
  padding: vars.spacing.s008,
  selectors: {
    '&::-webkit-calendar-picker-indicator': {
      filter: vars.color.colorSchemeFilter,
    },
    '&::-webkit-search-cancel-button': {
      filter: vars.color.colorSchemeFilter,
    },
    '&::-webkit-search-decoration': {
      filter: vars.color.colorSchemeFilter,
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

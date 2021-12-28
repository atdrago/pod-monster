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
    '&::-webkit-search-cancel-button': {
      display: 'none',
    },
    '&::-webkit-search-decoration': {
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

export const fieldContainer = style({
  position: 'relative',
});

export const clearButton = style({
  background: 'none',
  border: 0,
  bottom: 0,
  color: vars.color.foreground,
  cursor: 'pointer',
  display: 'block',
  fontSize: vars.typography.fontSize.s18,
  fontWeight: 'bold',
  lineHeight: 1,
  margin: 'auto',
  padding: `0 ${vars.spacing.s012}`,
  position: 'absolute',
  // Add 2 to account for the 2 pixel border of the input field
  right: 2,
  selectors: {
    [`${inputField}:placeholder-shown + &`]: {
      display: 'none',
    },
  },
  textAlign: 'center',
  top: 0,
});

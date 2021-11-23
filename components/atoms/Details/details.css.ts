import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const articleClassName = style({
  borderLeft: `${vars.spacing.s012} solid ${vars.color.blockquoteBorder}`,
  // margin needed here because `display: flex` has not effect on `<details>`
  marginTop: vars.spacing.s016,
  paddingLeft: vars.spacing.s016,
});

export const summaryClassName = style({
  color: vars.color.foreground,
  cursor: 'pointer',
  outline: 'none',
  selectors: {
    '&::marker, &::-webkit-details-marker': {
      display: 'none',
    },
  },
});

export const footerClassName = style({
  // margin needed here because `display: flex` has not effect on `<details>`
  marginTop: vars.spacing.s016,
});

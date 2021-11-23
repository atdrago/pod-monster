import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const labelClassName = style({
  background: vars.color.backgroundHighlight,
  boxShadow: vars.color.shadowElevationLow,
  display: 'inline-block',
  margin: 0,
  padding: `${vars.spacing.s008} ${vars.spacing.s008}`,
  width: 'auto',
});

import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const badgeClassName = style({
  background: vars.color.foreground,
  borderRadius: '4px',
  color: vars.color.background,
  display: 'inline-block',
  fontWeight: 'bold',
  lineHeight: '1',
  padding: `${vars.spacing.s008} ${vars.spacing.s004} 7px`,
  verticalAlign: 'middle',
  width: 'auto',
});

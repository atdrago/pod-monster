import { style } from '@vanilla-extract/css';

import { vars, typography, typographySizeVariant } from 'styles';

export const badgeClassName = style([
  typography,
  typographySizeVariant['legal'],
  {
    background: vars.color.foreground,
    borderRadius: '4px',
    color: vars.color.background,
    display: 'inline-block',
    fontWeight: 'bold',
    lineHeight: '1',
    padding: `${vars.spacing.s008} ${vars.spacing.s004} 7px`,
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    width: 'auto',
  },
]);

import { style } from '@vanilla-extract/css';

import { vars, typography, typographySizeVariant } from 'styles';

export const labelClassName = style([
  typography,
  typographySizeVariant['paragraph'],
  {
    background: vars.color.backgroundHighlight,
    boxShadow: vars.color.shadowElevationLow,
    display: 'inline-block',
    margin: 0,
    padding: `${vars.spacing.s008} ${vars.spacing.s008}`,
    width: 'auto',
  },
]);

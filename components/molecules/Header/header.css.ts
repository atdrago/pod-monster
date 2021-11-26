import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { headingLink, vars } from 'styles';

export const headerBaseClassName = style({
  alignItems: 'center',
  display: 'flex',
  gap: vars.spacing.s016,
  justifyContent: 'flex-start',
  margin: '-5px auto -6px',
  maxWidth: '100%',
});

export const homeLinkClassName = style([
  headingLink,
  {
    display: 'inline-block',
    // The margin and padding here increase the home button touch area without
    // increasing its size
    margin: `
      ${calc(vars.spacing.s008).negate().toString()}
      ${calc(vars.spacing.s016).negate().toString()}
    `,
    padding: `${vars.spacing.s008} ${vars.spacing.s016}`,
  },
]);

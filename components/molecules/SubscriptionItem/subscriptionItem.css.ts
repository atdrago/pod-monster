import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from 'styles';

export const subscriptionItemClassName = style({
  // Move the item left to account for the "new episodes" dot and gap
  marginLeft: calc(vars.spacing.s012).negate().toString(),
});

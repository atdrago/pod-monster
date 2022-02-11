import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const centeredPageLayout = style({
  maxWidth: '102.4rem',
  minHeight: ['100vh', 'calc(var(--vh, 1vh) * 100)'],
  padding: `${vars.spacing.s032} ${vars.spacing.s016}`,
});

import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const centeredPageLayout = style({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: `${vars.spacing.s032}`,
  justifyContent: 'center',
  margin: '0 auto',
  maxWidth: '102.4rem',
  minHeight: ['100vh', 'calc(var(--vh, 1vh) * 100)'],
  padding: `${vars.spacing.s032} ${vars.spacing.s016}`,
  width: '100%',
});

import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from 'styles';

export const dotClassName = style({
  borderRadius: '100%',
  display: 'inline-block',
  flex: '0 0 auto',
  height: vars.spacing.s008,
  margin: 0,
  padding: 0,
  width: vars.spacing.s008,
});

export const backgroundVariants = styleVariants({
  blue: {
    background: vars.color.blue,
  },
  green: {
    background: vars.color.green,
  },
  pink: {
    background: vars.color.pink,
  },
  red: {
    background: vars.color.red,
  },
  transparent: {
    background: 'transparent',
  },
  yellow: {
    background: vars.color.yellow,
  },
});

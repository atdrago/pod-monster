import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from 'styles';

export const progressBarContainer = style({
  background: vars.color.backgroundHighlight,
  height: vars.spacing.s004,
});

export const progressBar = style({
  height: vars.spacing.s004,
});

export const progressBarHighlightVariant = styleVariants({
  false: {
    background: vars.color.noteBorderColor,
  },
  true: {
    background: vars.color.foreground,
  },
});

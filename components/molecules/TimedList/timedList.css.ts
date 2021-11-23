import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from 'styles';

export const transcriptItem = style({
  // Disable the background transition on devices that don't support smooth
  // scrolling. It feels awkward for the background to animate if the list is
  // jumping to a new item.
  '@supports': {
    '(scroll-behavior: smooth)': {
      transition: 'background 250ms ease-in-out',
    },
  },
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  background: 'none',
  border: 0,
  color: vars.color.foreground,
  cursor: 'pointer',
  display: '-webkit-box',
  minHeight: '56px',
  overflow: 'hidden',
  padding: `0 ${vars.spacing.s008}`,
  wordBreak: 'break-word',
});

export const transcriptItemHighlight = style({
  background: vars.color.backgroundHighlight,
});

export const paragraph = style({
  marginLeft: `${calc(vars.spacing.s008).negate().toString()}`,
  paddingBottom: vars.spacing.s008,
  paddingTop: vars.spacing.s008,
});

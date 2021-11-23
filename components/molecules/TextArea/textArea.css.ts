import { style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const textArea = style({
  background: vars.color.background,
  border: `1px solid ${vars.color.buttonBorder}`,
  color: vars.color.foreground,
  fontFamily: 'monospace',
  fontSize: vars.typography.fontSize.s16,
  gridArea: '2/1',
  lineHeight: 1.4,
  padding: vars.spacing.s008,
  resize: 'horizontal',
  whiteSpace: 'pre-wrap',
  width: '100%',
});

export const textareaInputGroup = style({
  ':after': {
    border: `1px solid ${vars.color.buttonBorder}`,
    boxSizing: 'border-box',
    color: 'red',
    content: 'attr(data-value)',
    display: 'block',
    fontFamily: 'monospace',
    fontSize: vars.typography.fontSize.s16,
    gridArea: '2/1',
    lineHeight: 1.4,
    padding: vars.spacing.s008,
    visibility: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
});

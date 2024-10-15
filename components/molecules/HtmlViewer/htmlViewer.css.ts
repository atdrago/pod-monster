import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from 'styles';

export const htmlViewerContainer = style({});

export const imgClassName = style({
  height: 'auto',
  maxWidth: '100%',
});

export const listLayout = style({
  margin: 'auto',
  maxWidth: '48rem',
  paddingLeft: vars.spacing.s024,
  width: '100%',
});

globalStyle(
  `
  ${htmlViewerContainer} > *,
  ${htmlViewerContainer} ul,
  ${htmlViewerContainer} ol,
  ${htmlViewerContainer} p
`,
  {
    marginBottom: vars.spacing.s032,
  },
);

globalStyle(
  `
  ${htmlViewerContainer} li
`,
  {
    marginBottom: vars.spacing.s008,
    marginTop: vars.spacing.s008,
  },
);

globalStyle(
  `
  ${htmlViewerContainer} > *:last-child,
  ${htmlViewerContainer} li:last-child,
  ${htmlViewerContainer} ul:last-child,
  ${htmlViewerContainer} ol:last-child,
  ${htmlViewerContainer} p:last-child
`,
  {
    marginBottom: 0,
  },
);

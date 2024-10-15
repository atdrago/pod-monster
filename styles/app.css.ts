import { globalStyle } from '@vanilla-extract/css';

import { vars } from './theme.css';

/**
 * Most of these styles have been taken from
 * http://meyerweb.com/eric/tools/css/reset/
 * v2.0 | 20110126
 * License: none (public domain)
 */

globalStyle('*', {
  boxSizing: 'border-box',
});

globalStyle('html', {
  MozOsxFontSmoothing: 'grayscale',
  WebkitFontSmoothing: 'antialiased',
  // Prevent text from increasing on landscape on iOS
  WebkitTextSizeAdjust: '100%',
  background: vars.color.background,
  fontSize: '62.5%',
  fontSmooth: 'always',
});

globalStyle('body', {
  lineHeight: 1,
});

globalStyle('table', {
  borderCollapse: 'collapse',
  borderSpacing: 0,
});

globalStyle('a', {
  color: '#0070f3',
});

globalStyle('html, body', {
  fontFamily: `
    -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu,
    Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif
  `,
  margin: 0,
  padding: 0,
});

globalStyle(
  `
    html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p,
    blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em,
    img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u,
    i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table,
    caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details,
    embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby,
    section, summary, time, mark, audio, video
  `,
  {
    border: 0,
    margin: 0,
    padding: 0,
    verticalAlign: 'baseline',
  },
);

// HTML5 display-role reset for older browsers
globalStyle(
  `
    article, aside, details, figcaption, figure, footer, header, hgroup, menu,
    nav, section
  `,
  {
    display: 'block',
  },
);

globalStyle('blockquote, q', {
  quotes: 'none',
});

globalStyle('blockquote:before, blockquote:after, q:before, q:after', {
  content: '',
});

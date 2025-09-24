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

import { globalStyle } from '@vanilla-extract/css';

import { vars } from './theme.css';

globalStyle('html', {
  MozOsxFontSmoothing: 'grayscale',
  WebkitFontSmoothing: 'antialiased',
  // Prevent text from increasing on landscape on iOS
  WebkitTextSizeAdjust: '100%',
  background: vars.color.background,
  // TODO: Remove this font size adjust
  fontSize: '62.5%',
  fontSmooth: 'always',
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

import {
  assignVars,
  createGlobalTheme,
  globalStyle,
} from '@vanilla-extract/css';

const SHADOW_COLOR_LIGHT = '0deg 0% 50%';
const SHADOW_COLOR_DARK = '70deg 14% 5%';

export const vars = createGlobalTheme(':root', {
  color: {
    // #d0d0d0
    background: 'rgb(208, 208, 208)',
    backgroundBlurred: 'rgba(198, 198, 198, 0.7)',
    backgroundBlurredOpaque: 'rgb(198, 198, 198)',
    backgroundHighlight: 'rgba(218, 218, 218, 1)',
    backgroundSubtitles: 'rgba(198, 198, 198, 0.8)',
    blockquote: 'rgba(0, 0, 0, 0.7)',
    blockquoteBorder: 'rgba(0, 0, 0, 0.5)',
    blue: '#56B6C2',
    buttonBorder: '#0e0e10',
    colorSchemeFilter: 'none',
    foreground: '#272822',
    green: '#98C379',
    noteBorderColor: '#e5e5e5',
    pink: '#C678DD',
    red: '#E06C75',
    shadowElevationHigh: `
      0.3px 0.5px 0.7px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      1.5px 2.9px 3.7px -0.4px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      2.7px 5.4px 6.8px -0.7px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      4.5px 8.9px 11.2px -1.1px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      7.1px 14.3px 18px -1.4px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      11.2px 22.3px 28.1px -1.8px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      17px 33.9px 42.7px -2.1px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      25px 50px 62.9px -2.5px hsl(${SHADOW_COLOR_LIGHT} / 0.34)
    `,
    shadowElevationLow: `
      0.3px 0.5px 0.7px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      0.4px 0.8px 1px -1.2px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      1px 2px 2.5px -2.5px hsl(${SHADOW_COLOR_LIGHT} / 0.34)
    `,
    shadowElevationMedium: `
      0.3px 0.5px 0.7px hsl(${SHADOW_COLOR_LIGHT} / 0.36),
      0.8px 1.6px 2px -0.8px hsl(${SHADOW_COLOR_LIGHT} / 0.36),
      2.1px 4.1px 5.2px -1.7px hsl(${SHADOW_COLOR_LIGHT} / 0.36),
      5px 10px 12.6px -2.5px hsl(${SHADOW_COLOR_LIGHT} / 0.36)
    `,
    yellow: '#D19A66',
  },
  /**
   * See https://www.carbondesignsystem.com/guidelines/spacing/overview/
   */
  spacing: {
    s002: '0.2rem',
    s004: '0.4rem',
    s008: '0.8rem',
    s012: '1.2rem',
    s016: '1.6rem',
    s024: '2.4rem',
    s032: '3.2rem',
    s040: '4.0rem',
    s048: '4.8rem',
    s064: '6.4rem',
    s080: '8.0rem',
    s096: '9.6rem',
    s160: '16.0rem',
  },
  typography: {
    /**
     * https://www.carbondesignsystem.com/guidelines/typography/overview/#scale
     */
    fontSize: {
      s12: '1.2rem',
      s14: '1.4rem',
      s16: '1.6rem',
      s18: '1.8rem',
      s20: '2.0rem',
      s24: '2.4rem',
      s28: '2.8rem',
      s32: '3.2rem',
      s36: '3.6rem',
      s42: '4.2rem',
      s48: '4.8rem',
      s54: '5.4rem',
      s60: '6.0rem',
      s68: '6.8rem',
      s76: '7.6rem',
      s84: '8.4rem',
      s92: '9.2rem',
    },
  },
});

globalStyle(':root', {
  '@media': {
    'screen and (prefers-color-scheme: dark)': {
      vars: assignVars(vars.color, {
        // #272822
        background: 'rgb(39, 40, 34)',
        backgroundBlurred: 'rgba(29, 30, 24, 0.7)',
        backgroundBlurredOpaque: 'rgb(29, 30, 24)',
        backgroundHighlight: 'rgba(29, 30, 24, 1)',
        backgroundSubtitles: 'rgba(29, 30, 24, 0.8)',
        blockquote: 'rgba(255, 255, 255, 0.7)',
        blockquoteBorder: 'rgba(255, 255, 255, 0.5)',
        blue: '#56B6C2',
        buttonBorder: '#d0d0d0',
        colorSchemeFilter: 'invert(1)',
        foreground: '#d0d0d0',
        green: '#98C379',
        noteBorderColor: '#3e3e40',
        pink: '#C678DD',
        red: '#E06C75',
        shadowElevationHigh: `
          0.3px 0.5px 0.7px hsl(${SHADOW_COLOR_DARK} / 0.34),
          1.5px 2.9px 3.7px -0.4px hsl(${SHADOW_COLOR_DARK} / 0.34),
          2.7px 5.4px 6.8px -0.7px hsl(${SHADOW_COLOR_DARK} / 0.34),
          4.5px 8.9px 11.2px -1.1px hsl(${SHADOW_COLOR_DARK} / 0.34),
          7.1px 14.3px 18px -1.4px hsl(${SHADOW_COLOR_DARK} / 0.34),
          11.2px 22.3px 28.1px -1.8px hsl(${SHADOW_COLOR_DARK} / 0.34),
          17px 33.9px 42.7px -2.1px hsl(${SHADOW_COLOR_DARK} / 0.34),
          25px 50px 62.9px -2.5px hsl(${SHADOW_COLOR_DARK} / 0.34)
        `,
        shadowElevationLow: `
          0.3px 0.5px 0.7px hsl(${SHADOW_COLOR_DARK} / 0.34),
          0.4px 0.8px 1px -1.2px hsl(${SHADOW_COLOR_DARK} / 0.34),
          1px 2px 2.5px -2.5px hsl(${SHADOW_COLOR_DARK} / 0.34)
        `,
        shadowElevationMedium: `
          0.3px 0.5px 0.7px hsl(${SHADOW_COLOR_DARK} / 0.36),
          0.8px 1.6px 2px -0.8px hsl(${SHADOW_COLOR_DARK} / 0.36),
          2.1px 4.1px 5.2px -1.7px hsl(${SHADOW_COLOR_DARK} / 0.36),
          5px 10px 12.6px -2.5px hsl(${SHADOW_COLOR_DARK} / 0.36)
        `,
        yellow: '#D19A66',
      }),
    },
  },
});

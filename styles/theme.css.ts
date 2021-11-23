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
    backgroundHighlight: 'rgba(218, 218, 218, 1)',
    blockquote: 'rgba(0, 0, 0, 0.7)',
    blockquoteBorder: 'rgba(0, 0, 0, 0.5)',
    buttonBorder: '#0e0e10',
    colorSchemeFilter: 'none',
    foreground: '#272822',
    noteBorderColor: '#e5e5e5',
    shadowElevationHigh: `-0.2px -0.5px 0.6px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      -1.4px -2.9px 3.6px -0.4px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      -2.7px -5.4px 6.8px -0.7px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      -4.4px -8.8px 11.1px -1.1px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      -7px -14.1px 17.7px -1.4px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      -11px -22px 27.7px -1.8px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      -16.7px -33.5px 42.1px -2.1px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      -24.5px -49.4px 62px -2.5px hsl(${SHADOW_COLOR_LIGHT} / 0.34)
    `,
    shadowElevationLow: `-0.2px -0.5px 0.6px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      -0.4px -0.8px 1px -1.2px hsl(${SHADOW_COLOR_LIGHT} / 0.34),
      -1px -2px 2.5px -2.5px hsl(${SHADOW_COLOR_LIGHT} / 0.34)
    `,
    shadowElevationMedium: `-0.2px -0.5px 0.6px hsl(${SHADOW_COLOR_LIGHT} / 0.36),
      -0.8px -1.6px 2px -0.8px hsl(${SHADOW_COLOR_LIGHT} / 0.36),
      -2px -4.1px 5.1px -1.7px hsl(${SHADOW_COLOR_LIGHT} / 0.36),
      -4.9px -9.9px 12.4px -2.5px hsl(${SHADOW_COLOR_LIGHT} / 0.36)
    `,
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
        backgroundHighlight: 'rgba(29, 30, 24, 1)',
        blockquote: 'rgba(255, 255, 255, 0.7)',
        blockquoteBorder: 'rgba(255, 255, 255, 0.5)',
        buttonBorder: '#d0d0d0',
        colorSchemeFilter: 'invert(1)',
        foreground: '#d0d0d0',
        noteBorderColor: '#3e3e40',
        shadowElevationHigh: `-0.2px -0.5px 0.6px hsl(${SHADOW_COLOR_DARK} / 0.34),
          -1.4px -2.9px 3.6px -0.4px hsl(${SHADOW_COLOR_DARK} / 0.34),
          -2.7px -5.4px 6.8px -0.7px hsl(${SHADOW_COLOR_DARK} / 0.34),
          -4.4px -8.8px 11.1px -1.1px hsl(${SHADOW_COLOR_DARK} / 0.34),
          -7px -14.1px 17.7px -1.4px hsl(${SHADOW_COLOR_DARK} / 0.34),
          -11px -22px 27.7px -1.8px hsl(${SHADOW_COLOR_DARK} / 0.34),
          -16.7px -33.5px 42.1px -2.1px hsl(${SHADOW_COLOR_DARK} / 0.34),
          -24.5px -49.4px 62px -2.5px hsl(${SHADOW_COLOR_DARK} / 0.34)
        `,
        shadowElevationLow: `-0.2px -0.5px 0.6px hsl(${SHADOW_COLOR_DARK} / 0.34),
          -0.4px -0.8px 1px -1.2px hsl(${SHADOW_COLOR_DARK} / 0.34),
          -1px -2px 2.5px -2.5px hsl(${SHADOW_COLOR_DARK} / 0.34)
        `,
        shadowElevationMedium: `-0.2px -0.5px 0.6px hsl(${SHADOW_COLOR_DARK} / 0.36),
          -0.8px -1.6px 2px -0.8px hsl(${SHADOW_COLOR_DARK} / 0.36),
          -2px -4.1px 5.1px -1.7px hsl(${SHADOW_COLOR_DARK} / 0.36),
          -4.9px -9.9px 12.4px -2.5px hsl(${SHADOW_COLOR_DARK} / 0.36)
        `,
      }),
    },
  },
});

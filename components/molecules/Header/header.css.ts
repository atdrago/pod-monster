import { keyframes, style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { headingLink, vars } from 'styles';

export const headerBaseClassName = style({
  alignItems: 'center',
  justifyContent: 'center',
  margin: '-5px auto -6px',
});

export const homeLinkClassName = style([
  headingLink,
  {
    alignItems: 'center',
    display: 'inline-flex',
    flexDirection: 'column',
    gap: vars.spacing.s012,
    // The margin and padding here increase the home button touch area without
    // increasing its size
    margin: `
      ${calc(vars.spacing.s008).negate().toString()}
      ${calc(vars.spacing.s016).negate().toString()}
    `,
    padding: `${vars.spacing.s008} ${vars.spacing.s016}`,
    selectors: {
      '&:hover': {
        textDecoration: 'none',
      },
    },
    textDecoration: 'none',
  },
]);

const MAX_OFFSET = 2;
const MIN_OFFSET = -1 * MAX_OFFSET;

const logoTranslations = [
  [0, MIN_OFFSET],
  [0, MAX_OFFSET],
];

const translationCount = logoTranslations.length;

const logoAnimation = keyframes(
  logoTranslations.reduce((acc, [x, y], index) => {
    const percent = Math.floor((index / translationCount) * 100);
    const transform = `translate(${x}px, ${y}px)`;

    if (percent === 0) {
      // Wrap the last frame around to match the first
      acc = {
        ...acc,
        '100%': { transform },
      };
    }

    return {
      ...acc,
      [`${percent}%`]: { transform },
    };
  }, {}),
);

export const homeIconClassName = style({
  animation: `6s infinite ${logoAnimation} alternate ease-in-out`,
});

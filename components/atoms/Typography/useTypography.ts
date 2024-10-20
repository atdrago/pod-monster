import { useClassNames } from 'hooks/useClassNames';

import {
  typographySizeVariant,
  typographySizeVariantNoCapsize,
  typographyTextAlignVariant,
  typography,
} from 'styles';

import { TypographyProps } from './types';
import { ellipsisContainer } from './typography.css';

export const useTypography = ({
  className,
  shouldUseCapsize = true,
  size = 'headingLarge',
  textAlign = 'left',
  whitespace = 'normal',
}: TypographyProps) => {
  return useClassNames(
    typography,
    shouldUseCapsize
      ? typographySizeVariant[size]
      : typographySizeVariantNoCapsize[size],
    typographyTextAlignVariant[textAlign],
    whitespace === 'ellipsis' && !shouldUseCapsize
      ? ellipsisContainer
      : undefined,
    className,
  );
};

import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import type { ITypographyProps, TypographyComponent } from 'types';

import {
  ellipsisContainer,
  lineClampContainer,
  sizeVariant,
  sizeVariantNoCapsize,
  textAlignVariant,
  typography,
} from './typography.css';

export const useTypography = ({
  className,
  shouldUseCapsize = true,
  size = 'headingLarge',
  textAlign = 'left',
  whitespace = 'normal',
}: ITypographyProps) => {
  return useClassNames(
    typography,
    shouldUseCapsize ? sizeVariant[size] : sizeVariantNoCapsize[size],
    textAlignVariant[textAlign],
    whitespace === 'ellipsis' && !shouldUseCapsize
      ? ellipsisContainer
      : undefined,
    className
  );
};

export const Typography: TypographyComponent = ({
  children,
  className,
  shouldUseCapsize = true,
  size = 'headingLarge',
  textAlign = 'left',
  whitespace = 'normal',
  ...spanProps
}) => {
  const rootClassName = useTypography({
    className,
    shouldUseCapsize,
    size,
    textAlign,
    whitespace,
  });

  return (
    <Box as="span" className={rootClassName} {...spanProps}>
      {whitespace === 'ellipsis' && shouldUseCapsize ? (
        <span className={ellipsisContainer}>{children}</span>
      ) : typeof whitespace === 'number' && shouldUseCapsize ? (
        <span
          className={lineClampContainer}
          style={{ WebkitLineClamp: whitespace }}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </Box>
  );
};

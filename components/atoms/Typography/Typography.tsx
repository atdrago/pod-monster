import { Box, type PolymorphicComponentProps } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';

import {
  ellipsisContainer,
  lineClampContainer,
  sizeVariant,
  sizeVariantNoCapsize,
  textAlignVariant,
  typography,
} from './typography.css';

interface TypographyProps {
  className?: string;
  shouldUseCapsize?: boolean;
  size: keyof typeof sizeVariant;
  textAlign?: keyof typeof textAlignVariant;
  whitespace?: 'ellipsis' | 'normal' | number;
}

type TypographyComponentProps = PolymorphicComponentProps<
  React.ElementType<any>,
  TypographyProps
>;

export const useTypography = ({
  className,
  shouldUseCapsize = true,
  size = 'headingLarge',
  textAlign = 'left',
  whitespace = 'normal',
}: TypographyProps) => {
  return useClassNames(
    typography,
    shouldUseCapsize ? sizeVariant[size] : sizeVariantNoCapsize[size],
    textAlignVariant[textAlign],
    whitespace === 'ellipsis' && !shouldUseCapsize
      ? ellipsisContainer
      : undefined,
    className,
  );
};

export const Typography = ({
  children,
  className,
  shouldUseCapsize = true,
  size = 'headingLarge',
  textAlign = 'left',
  whitespace = 'normal',
  ...spanProps
}: TypographyComponentProps) => {
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

import { Box, type PolymorphicComponentProps } from 'react-polymorphic-box';

import { TypographyProps } from './types';
import { useTypography } from './useTypography';

import { ellipsisContainer, lineClampContainer } from './typography.css';

type TypographyComponentProps = PolymorphicComponentProps<
  React.ElementType<any>,
  TypographyProps
>;

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

import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import { vars } from 'styles';
import { TypographyComponent } from 'types/Typography';

import {
  ellipsisContainer,
  sizeVariant,
  sizeVariantNoCapsize,
  textAlignVariant,
  typography,
} from './typography.css';

export const Typography: TypographyComponent = ({
  children,
  className,
  shouldUseCapsize = true,
  size = 'headingLarge',
  textAlign = 'left',
  whitespace = 'normal',
  ...spanProps
}) => {
  const rootClassName = useClassNames(
    typography,
    shouldUseCapsize ? sizeVariant[size] : sizeVariantNoCapsize[size],
    textAlignVariant[textAlign],
    whitespace === 'ellipsis' && !shouldUseCapsize
      ? ellipsisContainer
      : undefined,
    className
  );

  return (
    <Box as="span" className={rootClassName} {...spanProps}>
      {whitespace === 'ellipsis' && shouldUseCapsize ? (
        <span className={ellipsisContainer}>{children}</span>
      ) : typeof whitespace === 'number' && shouldUseCapsize ? (
        <span
          style={{
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: whitespace,
            background: 'none',
            border: 0,
            color: vars.color.foreground,
            display: '-webkit-box',
            overflow: 'hidden',
            wordBreak: 'break-word',
          }}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </Box>
  );
};

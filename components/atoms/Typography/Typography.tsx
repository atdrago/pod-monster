import type { ElementType } from 'react';
import { Box, type PolymorphicComponentProps } from 'react-polymorphic-box';

import type { TypographyProps } from './types';

export const sizeClasses = {
  headingLarge: 'text-heading-large',
  headingMedium: 'text-heading-medium',
  headingSmall: 'text-heading-small',
  headingSmaller: 'text-heading-smaller',
  legal: 'text-legal',
  monospace: 'text-monospace',
  paragraph: 'text-paragraph',
} as const;

export const textAlignClasses = {
  center: 'text-center',
  left: 'text-left',
  right: 'text-right',
} as const;

const INLINE_ELEMENTS = new Set<ElementType>(['a', 'label', 'small', 'span']);

type TypographyComponentProps = PolymorphicComponentProps<
  ElementType,
  TypographyProps
>;

export const Typography = ({
  as = 'span',
  children,
  className,
  shouldTrimTextBox = true,
  size = 'headingLarge',
  textAlign = 'left',
  whitespace = 'normal',
  width = 'content',
  ...props
}: TypographyComponentProps) => {
  // The monospace size keeps its full line box, as in the legacy styles.
  const isTrimmed = shouldTrimTextBox && size !== 'monospace';
  // `text-box` does not trim an inline box, so an inline root becomes a block.
  const isInline = typeof as !== 'string' || INLINE_ELEMENTS.has(as);
  const widthClassName =
    width === 'content'
      ? `mx-auto w-full ${size === 'monospace' ? 'max-w-none' : 'max-w-content'}`
      : '';
  // An ellipsis root must shrink below the width of its text in a flex row or
  // a grid column. The root does not clip its overflow, so it needs min-w-0.
  const shrinkClassName = whitespace === 'ellipsis' ? 'min-w-0' : '';

  return (
    <Box
      as={as}
      className={`
        wrap-anywhere
        ${sizeClasses[size]}
        ${textAlignClasses[textAlign]}
        ${widthClassName}
        ${isTrimmed ? 'text-box-trim-cap' : ''}
        ${isTrimmed && isInline ? 'block' : ''}
        ${shrinkClassName}
        ${className ?? ''}
      `}
      {...props}
    >
      {whitespace === 'ellipsis' ? (
        <span className="block overflow-x-clip text-ellipsis whitespace-nowrap">
          {children}
        </span>
      ) : typeof whitespace === 'number' ? (
        <span
          className="
            overflow-hidden wrap-anywhere
            [display:-webkit-box] [-webkit-box-orient:vertical]
          "
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

import { forwardRef } from 'react';
import { Box } from 'react-polymorphic-box';

import type { StackProps } from 'types';

export const Stack = forwardRef<HTMLElement, StackProps>(function StackRef(
  {
    // `align` is not defaulted to anything because the meaning of `align-items`
    // changes based on the `display` property
    align,
    as = 'div',
    className,
    justify,
    kind = 'flex',
    maxWidth = 'none',
    space = 'medium',
    ...divProps
  }: StackProps,
  ref,
) {
  const spaceClasses = {
    large: 'gap-12',
    medium: 'gap-8',
    none: 'gap-0',
    small: 'gap-4',
    xlarge: 'gap-16',
    xsmall: 'gap-2',
    xxsmall: 'gap-1',
  };

  const maxWidthClasses = {
    none: 'max-w-none',
    small: 'max-w-3xl', // 48rem
  };

  const kindClasses = {
    flex: 'flex flex-col',
    flexRow: 'flex flex-row',
    flexRowReverse: 'flex flex-row-reverse',
    grid: 'grid',
  };

  const alignClasses = {
    center: 'items-center',
    end: 'items-end',
    start: 'items-start',
  };

  const justifyClasses = {
    center: 'justify-center',
    spaceBetween: 'justify-between',
  };

  return (
    <Box
      as={as}
      className={`
        mx-auto w-full
        ${spaceClasses[space]}
        ${maxWidthClasses[maxWidth]}
        ${kindClasses[kind]}
        ${align ? alignClasses[align] : ''}
        ${justify ? justifyClasses[justify] : ''}
        ${className ?? ''}
      `}
      ref={ref}
      {...divProps}
    />
  );
});

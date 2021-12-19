import { FunctionComponent, forwardRef } from 'react';
import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import type { StackProps } from 'types';

import {
  alignVariant,
  justifyVariant,
  kindVariant,
  maxWidthVariant,
  spaceVariant,
  stack,
} from './stack.css';

export const Stack: FunctionComponent<StackProps> = forwardRef<
  HTMLElement,
  StackProps
>(function StackRef(
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
  },
  ref
) {
  const rootClassName = useClassNames(
    stack,
    spaceVariant[space],
    maxWidthVariant[maxWidth],
    kindVariant[kind],
    align && alignVariant[align],
    justify && justifyVariant[justify],
    className
  );

  return <Box as={as} className={rootClassName} ref={ref} {...divProps} />;
});

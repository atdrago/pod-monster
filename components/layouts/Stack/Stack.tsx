import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import { StackComponent } from 'types';

import {
  alignVariant,
  justifyVariant,
  kindVariant,
  maxWidthVariant,
  spaceVariant,
  stack,
} from './stack.css';

export const Stack: StackComponent = ({
  // `align` is not defaulted to anything because the meaning of `align-items`
  // changes based on the `display` property
  align,
  className,
  justify,
  kind = 'flex',
  maxWidth = 'none',
  space = 'medium',
  ...divProps
}) => {
  const rootClassName = useClassNames(
    stack,
    spaceVariant[space],
    maxWidthVariant[maxWidth],
    kindVariant[kind],
    align && alignVariant[align],
    justify && justifyVariant[justify],
    className
  );

  return <Box as="div" className={rootClassName} {...divProps} />;
};

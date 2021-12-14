import type { FunctionComponent } from 'react';
import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import type { ButtonProps } from 'types';

import { button, buttonVariant, edgeVariant, sizeVariant } from './button.css';

export const Button: FunctionComponent<ButtonProps> = ({
  as = 'button',
  className,
  edge = 'normal',
  size = 'medium',
  variant = 'default',
  ...rest
}) => {
  const rootClassName = useClassNames(
    button,
    buttonVariant[variant],
    sizeVariant[size],
    edgeVariant[edge],
    className
  );

  return <Box as={as} className={rootClassName} type="button" {...rest} />;
};

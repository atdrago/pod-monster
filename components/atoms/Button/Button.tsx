import type { FunctionComponent } from 'react';
import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import type { ButtonProps } from 'types';

import { button, buttonVariant, sizeVariant } from './button.css';

export const Button: FunctionComponent<ButtonProps> = ({
  as = 'button',
  className,
  size = 'medium',
  variant = 'default',
  ...rest
}) => {
  const rootClassName = useClassNames(
    button,
    buttonVariant[variant],
    sizeVariant[size],
    className
  );

  return <Box as={as} className={rootClassName} type="button" {...rest} />;
};

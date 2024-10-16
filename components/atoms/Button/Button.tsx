import type { ElementType } from 'react';
import { Box, type PolymorphicComponentProps } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';

import { button, buttonVariant, sizeVariant } from './button.css';

type ButtonProps = PolymorphicComponentProps<
  ElementType,
  {
    size?: keyof typeof sizeVariant;
    variant?: keyof typeof buttonVariant;
  }
>;

export const Button = ({
  as = 'button',
  className,
  size = 'medium',
  variant = 'default',
  ...rest
}: ButtonProps) => {
  const rootClassName = useClassNames(
    button,
    buttonVariant[variant],
    sizeVariant[size],
    className,
  );

  return <Box as={as} className={rootClassName} type="button" {...rest} />;
};

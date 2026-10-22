import type { ElementType, PropsWithChildren } from 'react';
import { Box, type PolymorphicComponentProps } from 'react-polymorphic-box';

type ButtonProps = PolymorphicComponentProps<ElementType, PropsWithChildren>;

export const Button = ({ as = 'button', className, ...rest }: ButtonProps) => (
  <Box
    as={as}
    className={`
      border border-button-border
      text-foreground
      bg-background
      rounded-sm m-0 p-3
      cursor-pointer text-base
      ${className ?? ''}
    `}
    type="button"
    {...rest}
  />
);

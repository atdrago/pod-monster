import type { ElementType, PropsWithChildren } from 'react';
import { Box, type PolymorphicComponentProps } from 'react-polymorphic-box';

type ButtonProps = PolymorphicComponentProps<ElementType, PropsWithChildren>;

export const Button = ({ as = 'button', className, ...rest }: ButtonProps) => (
  <Box
    as={as}
    className={`
      border border-zinc-800 dark:border-zinc-400
      text-zinc-900 dark:text-zinc-100
      bg-zinc-100 dark:bg-zinc-900
      rounded-lg m-0 p-3
      cursor-pointer text-lg
      ${className}
    `}
    type="button"
    {...rest}
  />
);

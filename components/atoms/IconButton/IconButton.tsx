import { ElementType } from 'react';
import { Box, type PolymorphicComponentProps } from 'react-polymorphic-box';

type IconButtonSize = 'small' | 'medium' | 'large';
type IconButtonBackground = 'default' | 'circle';

type IconButtonProps = PolymorphicComponentProps<
  ElementType,
  {
    background?: IconButtonBackground;
    label?: string;
    size?: IconButtonSize;
  }
>;

const sizeClasses = {
  large: 'h-[75px] w-[75px]',
  medium: 'h-[50px] w-[50px]',
  small: 'h-[30px] w-[30px]',
} as const;

const backgroundClasses = {
  circle: `rounded-full p-4 text-center
    bg-background
    border-2 border-foreground`,
  default: 'bg-none border-0 p-0',
} as const;

export const IconButton = ({
  as: asProp = 'button',
  background = 'default',
  className,
  label,
  size = 'small',
  ...props
}: IconButtonProps) => {
  const buttonProps =
    asProp === 'button' ? { 'aria-label': label, type: 'button' } : undefined;

  return (
    <Box
      as={asProp}
      className={`
        inline-flex items-center justify-center flex-none
        cursor-pointer
        m-0
        ${sizeClasses[size]}
        ${backgroundClasses[background]}
        ${className ?? ''}
      `}
      {...buttonProps}
      {...props}
    />
  );
};

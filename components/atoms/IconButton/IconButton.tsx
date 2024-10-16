import { ElementType } from 'react';
import { Box, type PolymorphicComponentProps } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';

import { backgroundVariant, iconButton, sizeVariant } from './iconButton.css';

type IconButtonProps = PolymorphicComponentProps<
  ElementType,
  {
    background?: keyof typeof backgroundVariant;
    label?: string;
    size?: keyof typeof sizeVariant;
  }
>;

export const IconButton = ({
  as: asProp = 'button',
  background = 'default',
  className,
  label,
  size = 'small',
  ...props
}: IconButtonProps) => {
  const baseClassName = useClassNames(
    iconButton,
    backgroundVariant[background],
    sizeVariant[size],
    className,
  );

  const buttonProps =
    asProp === 'button' ? { 'aria-label': label, type: 'button' } : undefined;

  return (
    <Box as={asProp} className={baseClassName} {...buttonProps} {...props} />
  );
};

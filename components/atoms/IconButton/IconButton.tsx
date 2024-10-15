import { ElementType } from 'react';
import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import type { IconButtonComponent } from 'types';

import { backgroundVariant, iconButton, sizeVariant } from './iconButton.css';

export const IconButton: IconButtonComponent = ({
  as: asProp = 'button' as ElementType<any>,
  background = 'default',
  className,
  label,
  size = 'small',
  ...props
}) => {
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

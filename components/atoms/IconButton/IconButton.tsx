import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import { IconButtonComponent } from 'types';

import { backgroundVariant, iconButton, sizeVariant } from './iconButton.css';

export const IconButton: IconButtonComponent = ({
  background = 'default',
  className,
  label,
  size = 'small',
  ...buttonProps
}) => {
  const baseClassName = useClassNames(
    iconButton,
    backgroundVariant[background],
    sizeVariant[size],
    className
  );

  return (
    <Box
      aria-label={label}
      as="button"
      className={baseClassName}
      type="button"
      {...buttonProps}
    />
  );
};

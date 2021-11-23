import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import { vars } from 'styles';
import type { IconComponent } from 'types';

import { icon, iconOrientationVariant, iconSizeVariant } from './icon.css';

export const Icon: IconComponent = ({
  className,
  color = 'foreground',
  orientation = 'default',
  size,
  ...spanProps
}) => {
  const rootClassName = useClassNames(
    icon,
    iconSizeVariant[size],
    iconOrientationVariant[orientation],
    className
  );

  return (
    <Box
      as="span"
      className={rootClassName}
      style={{ color: vars.color[color] }}
      {...spanProps}
    />
  );
};

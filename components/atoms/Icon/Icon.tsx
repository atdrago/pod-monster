import { Box } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import { vars } from 'styles';
import type { IconComponentProps } from 'types';

import { icon, iconOrientationVariant, iconSizeVariant } from './icon.css';

export const Icon = ({
  className,
  color = 'foreground',
  orientation = 'default',
  size,
  ...spanProps
}: IconComponentProps) => {
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

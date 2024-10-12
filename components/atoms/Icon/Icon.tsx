import { Box, PolymorphicComponentProps } from 'react-polymorphic-box';

import { useClassNames } from 'hooks/useClassNames';
import { vars } from 'styles';

import { icon, iconOrientationVariant, iconSizeVariant } from './icon.css';

type IconComponentProps = PolymorphicComponentProps<
  React.ElementType,
  {
    color?: keyof typeof vars.color;
    orientation?: keyof typeof iconOrientationVariant;
    size: keyof typeof iconSizeVariant;
  }
>;

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
